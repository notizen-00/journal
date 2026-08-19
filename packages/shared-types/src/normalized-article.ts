/**
 * Canonical article shape produced by the OAI Gateway after harvesting +
 * normalization. This is what Publisher, the worker and the static builder
 * agree on regardless of which OJS version/instance the data came from
 * (PRD §7, §26).
 */
export interface NormalizedArticle {
  oaiIdentifier: string;
  title: string;
  abstract: string | null;
  authors: NormalizedAuthor[];
  keywords: string[];
  publicationDate: string | null;
  doi: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  url: string | null;
  pdfUrl: string | null;
}

export interface NormalizedAuthor {
  name: string;
  affiliation: string | null;
  orcid: string | null;
  order: number;
}

export interface NormalizedIssue {
  oaiIdentifier: string;
  volume: string | null;
  number: string | null;
  year: number | null;
  title: string | null;
  publicationDate: string | null;
}
