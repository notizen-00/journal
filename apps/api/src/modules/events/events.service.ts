import { Injectable } from "@nestjs/common";
import { Observable, distinctUntilChanged, from, map, shareReplay, switchMap, timer } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";

/** Live snapshot of everything the admin dashboard shows as "in progress". */
export interface JournalSnapshot {
  journalId: string;
  sync: {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
    /** Records processed so far in this run — drives the live progress readout. */
    processed: number;
    failed: number;
  } | null;
  builds: {
    id: string;
    status: string;
    pagesCount: number | null;
    assetsCount: number | null;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    deployed: boolean;
  }[];
  counts: { articles: number; issues: number; pages: number };
}

const POLL_INTERVAL_MS = 1500;

@Injectable()
export class EventsService {
  /**
   * One shared poll loop per journal, not per subscriber: several open admin
   * tabs on the same journal collapse into a single database poll, and the
   * loop stops entirely once the last subscriber disconnects (`refCount`).
   */
  private readonly streams = new Map<string, Observable<JournalSnapshot>>();

  constructor(private readonly prisma: PrismaService) {}

  stream(journalId: string): Observable<JournalSnapshot> {
    const existing = this.streams.get(journalId);
    if (existing) return existing;

    const stream = timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => from(this.snapshot(journalId))),
      // The poll is unconditional; only actual state changes reach the client.
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.streams.set(journalId, stream);
    return stream;
  }

  async snapshot(journalId: string): Promise<JournalSnapshot> {
    const [latestSync, builds, articles, issues, pages] = await Promise.all([
      this.prisma.syncRun.findFirst({ where: { journalId }, orderBy: { createdAt: "desc" } }),
      this.prisma.build.findMany({
        where: { journalId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { deployment: true },
      }),
      this.prisma.article.count({ where: { journalId } }),
      this.prisma.issue.count({ where: { journalId } }),
      this.prisma.page.count({ where: { journalId } }),
    ]);

    const [processed, failed] = latestSync
      ? await Promise.all([
          this.prisma.syncItem.count({ where: { syncRunId: latestSync.id } }),
          this.prisma.syncItem.count({ where: { syncRunId: latestSync.id, status: "error" } }),
        ])
      : [0, 0];

    return {
      journalId,
      sync: latestSync
        ? {
            id: latestSync.id,
            status: latestSync.status,
            startedAt: latestSync.startedAt?.toISOString() ?? null,
            finishedAt: latestSync.finishedAt?.toISOString() ?? null,
            errorMessage: latestSync.errorMessage,
            processed,
            failed,
          }
        : null,
      builds: builds.map((build) => ({
        id: build.id,
        status: build.status,
        pagesCount: build.pagesCount,
        assetsCount: build.assetsCount,
        errorMessage: build.errorMessage,
        startedAt: build.startedAt?.toISOString() ?? null,
        finishedAt: build.finishedAt?.toISOString() ?? null,
        deployed: build.deployment?.status === "ACTIVE",
      })),
      counts: { articles, issues, pages },
    };
  }

  /** SSE frames for Nest's `@Sse()` handler. */
  sseStream(journalId: string): Observable<{ data: string }> {
    return this.stream(journalId).pipe(map((snapshot) => ({ data: JSON.stringify(snapshot) })));
  }
}
