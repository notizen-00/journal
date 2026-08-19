import fs from "node:fs/promises";
import path from "node:path";
import { Worker, type Job } from "bullmq";
import type { StaticBuildJobData } from "@journal/shared-types";
import { QUEUE_STATIC_BUILD } from "../config/queues";
import { prisma } from "../prisma";
import { runWebBuilder } from "../build/run-build";
import { activateRelease, listFilesRecursive, releaseDirFor, releasesRootFor } from "../build/releases";
import type { connectionOptions } from "../redis";

const BUILD_OUTPUT_DIR = process.env.BUILD_OUTPUT_DIR ?? "/data/releases";
const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(__dirname, "../../../..");
const API_BASE_URL = process.env.API_BASE_URL ?? "http://api:3000";
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN ?? "";

/**
 * Consumes `static-build` jobs: runs the Svelte static builder, then
 * atomically activates the new release (or, for rollback jobs, just
 * re-activates an existing one) — PRD §16, §18-20.
 */
export function createStaticBuildWorker(connection: typeof connectionOptions) {
  return new Worker<StaticBuildJobData>(
    QUEUE_STATIC_BUILD,
    async (job: Job<StaticBuildJobData>) => {
      const { buildId, journalId, activateOnly } = job.data;

      if (activateOnly) {
        await activateRelease(BUILD_OUTPUT_DIR, journalId, buildId);
        await prisma.deployment.updateMany({
          where: { journalId, status: "ACTIVE" },
          data: { status: "ROLLED_BACK" },
        });
        await prisma.deployment.create({
          data: {
            journalId,
            buildId,
            status: "ACTIVE",
            releasePath: releaseDirFor(BUILD_OUTPUT_DIR, journalId, buildId),
            activatedAt: new Date(),
          },
        });
        return;
      }

      const startedAt = new Date();
      await prisma.build.update({ where: { id: buildId }, data: { status: "RUNNING", startedAt } });

      const outDir = releaseDirFor(BUILD_OUTPUT_DIR, journalId, buildId);
      await fs.mkdir(outDir, { recursive: true });

      const result = await runWebBuilder({
        journalId,
        outDir,
        apiBaseUrl: API_BASE_URL,
        internalToken: INTERNAL_API_TOKEN,
        repoRoot: REPO_ROOT,
      });

      if (!result.success) {
        await prisma.build.update({
          where: { id: buildId },
          data: {
            status: "FAILED",
            errorMessage: result.log.slice(-4000),
            finishedAt: new Date(),
          },
        });
        // current release is untouched — production stays on the last good build.
        throw new Error("Static build failed, see Build.errorMessage");
      }

      const files = await listFilesRecursive(outDir);
      await prisma.$transaction([
        prisma.buildPage.deleteMany({ where: { buildId } }),
        prisma.buildPage.createMany({ data: files.map((filePath) => ({ buildId, path: filePath })) }),
      ]);

      await fs.mkdir(releasesRootFor(BUILD_OUTPUT_DIR, journalId), { recursive: true });
      await activateRelease(BUILD_OUTPUT_DIR, journalId, buildId);

      await prisma.deployment.updateMany({
        where: { journalId, status: "ACTIVE" },
        data: { status: "ROLLED_BACK" },
      });
      await prisma.deployment.create({
        data: { journalId, buildId, status: "ACTIVE", releasePath: outDir, activatedAt: new Date() },
      });

      await prisma.build.update({
        where: { id: buildId },
        data: {
          status: "SUCCESS",
          pagesCount: files.filter((f) => f.endsWith(".html")).length,
          assetsCount: files.length,
          finishedAt: new Date(),
        },
      });
    },
    { connection, concurrency: process.env.BUILD_CONCURRENCY ? Number(process.env.BUILD_CONCURRENCY) : 1 },
  );
}
