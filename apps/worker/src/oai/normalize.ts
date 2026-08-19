import type { OaiRecord } from "./oai-pmh-client";

export interface NormalizedAuthorInput {
  name: string;
  affiliation: string | null;
  orcid: string | null;
  order: number;
}

export interface NormalizedArticleInput {
  oaiIdentifier: string;
  title: string;
  abstract: string | null;
  authors: NormalizedAuthorInput[];
  keywords: string[];
  publicationDate: Date | null;
  doi: string | null;
  url: string | null;
  pdfUrl: string | null;
  issueGuess: { volume: string | null; number: string | null; year: number | null } | null;
}

function first(values: string[] | undefined): string | null {
  return values && values.length > 0 ? values[0] : null;
}

/** "Last, First" (OJS default dc:creator format) -> "First Last". */
function humanizeAuthorName(raw: string): string {
  const [last, first] = raw.split(",").map((part) => part.trim());
  return first ? `${first} ${last}` : raw.trim();
}

function extractDoi(identifiers: string[]): string | null {
  for (const id of identifiers) {
    const match = id.match(/10\.\d{4,9}\/\S+/);
    if (match) return match[0].replace(/[.,]$/, "");
  }
  return null;
}

function extractUrl(identifiers: string[]): string | null {
  return identifiers.find((id) => /^https?:\/\//.test(id) && !id.includes("doi.org")) ?? null;
}

/** Best-effort parse of OJS's "Journal Name; Vol X No Y (Year): Section; pages" dc:source. */
function guessIssueFromSource(source: string | null) {
  if (!source) return null;
  const volMatch = source.match(/Vol(?:ume)?\.?\s*(\d+)/i);
  const noMatch = source.match(/No\.?\s*(\d+)/i);
  const yearMatch = source.match(/\((\d{4})\)/);
  if (!volMatch && !noMatch && !yearMatch) return null;
  return {
    volume: volMatch?.[1] ?? null,
    number: noMatch?.[1] ?? null,
    year: yearMatch ? Number(yearMatch[1]) : null,
  };
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Maps a raw OAI-PMH oai_dc record into Publisher's normalized shape (PRD §7, §26). */
export function normalizeRecord(record: OaiRecord): NormalizedArticleInput {
  const dc = record.dc;
  const identifiers = dc.identifier ?? [];

  return {
    oaiIdentifier: record.identifier,
    title: first(dc.title) ?? "(untitled)",
    abstract: first(dc.description),
    authors: (dc.creator ?? []).map((name, index) => ({
      name: humanizeAuthorName(name),
      affiliation: null,
      orcid: null,
      order: index,
    })),
    keywords: dc.subject ?? [],
    publicationDate: parseDate(first(dc.date)),
    doi: extractDoi(identifiers),
    url: extractUrl(identifiers),
    pdfUrl: (dc.relation ?? []).find((rel) => /\.pdf(\?|$)/i.test(rel)) ?? null,
    issueGuess: guessIssueFromSource(first(dc.source)),
  };
}

export function slugify(title: string, fallback: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}
