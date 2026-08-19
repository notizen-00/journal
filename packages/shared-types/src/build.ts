export type BuildStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
export type DeploymentStatus = "PENDING" | "ACTIVE" | "ROLLED_BACK" | "FAILED";
export type SyncStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type JournalStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

/** Payload the API enqueues on the `static-build` BullMQ queue (PRD §18-20). */
export interface StaticBuildJobData {
  buildId: string;
  journalId: string;
  /** Specific paths to rebuild; empty/undefined means full rebuild. */
  affectedPaths?: string[];
  /**
   * When true, skip re-running the static builder and just re-activate the
   * `buildId` release that is already on disk (PRD §19 - rollback).
   */
  activateOnly?: boolean;
}

/** Payload the API enqueues on the `oai-harvest` BullMQ queue (PRD §8-9). */
export interface OaiHarvestJobData {
  syncRunId: string;
  journalId: string;
}
