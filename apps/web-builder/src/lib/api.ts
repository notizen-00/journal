/**
 * Build-time only data access (PRD §16, §24). These calls run exclusively
 * inside `+*.server.ts` load functions during `vite build` prerendering —
 * never in the browser — so the internal token never reaches client JS.
 */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN ?? "";
const JOURNAL_ID = process.env.JOURNAL_ID ?? "";

async function get<T>(pathname: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${pathname}`, {
    headers: { "x-internal-token": INTERNAL_API_TOKEN },
  });
  if (!res.ok) {
    throw new Error(`Build data fetch failed: ${pathname} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface JournalData {
  id: string;
  name: string;
  acronym: string | null;
  issn: string | null;
  eissn: string | null;
  description: string | null;
  logoUrl: string | null;
  theme: { key: string } | null;
  themeSettings: { themeId: string; settings: Record<string, unknown> }[];
}

export interface PageData {
  id: string;
  slug: string;
  title: string;
  blocks: unknown[];
  status: string;
}

export interface MenuData {
  id: string;
  name: string;
  location: string;
  items: { id: string; label: string; url: string; order: number; parentId: string | null }[];
}

export interface ArticleData {
  id: string;
  title: string;
  abstract: string | null;
  slug: string;
  doi: string | null;
  pages: string | null;
  url: string | null;
  pdfUrl: string | null;
  publicationDate: string | null;
  keywords: string[];
  authors: { order: number; author: { name: string; affiliation: string | null } }[];
  issue: { id: string; volume: string | null; number: string | null; year: number | null } | null;
}

export interface IssueData {
  id: string;
  volume: string | null;
  number: string | null;
  year: number | null;
  title: string | null;
  publicationDate: string | null;
  articles: { id: string; title: string; slug: string }[];
}

export const buildJournalId = JOURNAL_ID;

export const journalApi = {
  getJournal: () => get<JournalData>(`/public/journals/${JOURNAL_ID}`),
  getPages: () => get<PageData[]>(`/public/journals/${JOURNAL_ID}/pages`),
  getMenus: () => get<MenuData[]>(`/public/journals/${JOURNAL_ID}/menus`),
  getArticles: () => get<ArticleData[]>(`/public/journals/${JOURNAL_ID}/articles`),
  getIssues: () => get<IssueData[]>(`/public/journals/${JOURNAL_ID}/issues`),
};
