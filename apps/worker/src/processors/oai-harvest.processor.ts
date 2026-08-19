import { Worker, type Job } from "bullmq";
import type { OaiHarvestJobData } from "@journal/shared-types";
import { QUEUE_OAI_HARVEST } from "../config/queues";
import { prisma } from "../prisma";
import { harvestAll } from "../oai/oai-pmh-client";
import { normalizeRecord, slugify } from "../oai/normalize";
import type { connectionOptions } from "../redis";

/**
 * Consumes `oai-harvest` jobs: pulls new/changed records from the journal's
 * OAI-PMH endpoint since the last successful run, normalizes them, and
 * upserts Articles/Issues/Authors (PRD §7-9, §26).
 */
export function createOaiHarvestWorker(connection: typeof connectionOptions) {
  return new Worker<OaiHarvestJobData>(
    QUEUE_OAI_HARVEST,
    async (job: Job<OaiHarvestJobData>) => {
      const { syncRunId, journalId } = job.data;

      const syncRun = await prisma.syncRun.update({
        where: { id: syncRunId },
        data: { status: "RUNNING", startedAt: new Date() },
      });

      const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        include: { source: true },
      });

      if (!journal?.source) {
        await prisma.syncRun.update({
          where: { id: syncRunId },
          data: { status: "FAILED", errorMessage: "Journal has no OAI source configured", finishedAt: new Date() },
        });
        return;
      }

      try {
        const records = await harvestAll({
          endpoint: journal.source.oaiEndpoint,
          from: syncRun.fromDate?.toISOString(),
          set: journal.source.oaiSetSpec ?? undefined,
        });

        for (const record of records) {
          try {
            if (record.deleted) {
              await prisma.syncItem.create({
                data: { syncRunId, oaiIdentifier: record.identifier, status: "deleted" },
              });
              continue;
            }

            const normalized = normalizeRecord(record);

            let issueId: string | undefined;
            if (normalized.issueGuess) {
              const issue = await prisma.issue.upsert({
                where: {
                  journalId_oaiIdentifier: {
                    journalId,
                    oaiIdentifier: `guess:${normalized.issueGuess.volume}-${normalized.issueGuess.number}`,
                  },
                },
                update: {},
                create: {
                  journalId,
                  oaiIdentifier: `guess:${normalized.issueGuess.volume}-${normalized.issueGuess.number}`,
                  volume: normalized.issueGuess.volume,
                  number: normalized.issueGuess.number,
                  year: normalized.issueGuess.year,
                },
              });
              issueId = issue.id;
            }

            const article = await prisma.article.upsert({
              where: { journalId_oaiIdentifier: { journalId, oaiIdentifier: normalized.oaiIdentifier } },
              update: {
                title: normalized.title,
                abstract: normalized.abstract,
                keywords: normalized.keywords,
                doi: normalized.doi,
                url: normalized.url,
                pdfUrl: normalized.pdfUrl,
                publicationDate: normalized.publicationDate,
                issueId,
                rawMetadata: record.dc as object,
              },
              create: {
                journalId,
                issueId,
                oaiIdentifier: normalized.oaiIdentifier,
                title: normalized.title,
                slug: slugify(normalized.title, normalized.oaiIdentifier.replace(/[^a-zA-Z0-9]+/g, "-")),
                abstract: normalized.abstract,
                keywords: normalized.keywords,
                doi: normalized.doi,
                url: normalized.url,
                pdfUrl: normalized.pdfUrl,
                publicationDate: normalized.publicationDate,
                rawMetadata: record.dc as object,
              },
            });

            await prisma.articleAuthor.deleteMany({ where: { articleId: article.id } });
            for (const authorInput of normalized.authors) {
              const author =
                (await prisma.author.findFirst({ where: { name: authorInput.name } })) ??
                (await prisma.author.create({
                  data: {
                    name: authorInput.name,
                    affiliation: authorInput.affiliation,
                    orcid: authorInput.orcid,
                  },
                }));
              await prisma.articleAuthor.create({
                data: { articleId: article.id, authorId: author.id, order: authorInput.order },
              });
            }

            await prisma.syncItem.create({
              data: { syncRunId, oaiIdentifier: record.identifier, status: "ok" },
            });
          } catch (itemError) {
            await prisma.syncItem.create({
              data: {
                syncRunId,
                oaiIdentifier: record.identifier,
                status: "error",
                message: (itemError as Error).message,
              },
            });
          }
        }

        await prisma.syncRun.update({
          where: { id: syncRunId },
          data: { status: "SUCCESS", toDate: new Date(), finishedAt: new Date() },
        });
      } catch (error) {
        await prisma.syncRun.update({
          where: { id: syncRunId },
          data: { status: "FAILED", errorMessage: (error as Error).message, finishedAt: new Date() },
        });
        throw error;
      }
    },
    { connection, concurrency: 1 },
  );
}
