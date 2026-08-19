import { XMLParser } from "fast-xml-parser";

export interface OaiRecord {
  identifier: string;
  datestamp: string;
  deleted: boolean;
  /** Dublin Core fields, each possibly repeated so arrays. */
  dc: Record<string, string[]>;
}

interface ListRecordsResult {
  records: OaiRecord[];
  resumptionToken: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object" && "#text" in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)["#text"]);
  }
  return "";
}

/**
 * Harvests one page of an OAI-PMH ListRecords response (oai_dc metadata,
 * the format OJS exposes by default). Callers loop using the returned
 * resumptionToken until it comes back null (PRD §7-9).
 */
export type OaiGranularity = "seconds" | "date";

/**
 * OAI-PMH only accepts `YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ssZ`. A raw
 * `Date.toISOString()` carries milliseconds, which repositories reject with
 * `badArgument` — that silently broke every incremental harvest.
 */
export function formatOaiDate(iso: string, granularity: OaiGranularity): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const seconds = date.toISOString().replace(/\.\d+Z$/, "Z");
  return granularity === "date" ? seconds.slice(0, 10) : seconds;
}

export async function listRecords(params: {
  endpoint: string;
  from?: string;
  set?: string;
  resumptionToken?: string;
  granularity?: OaiGranularity;
}): Promise<ListRecordsResult> {
  const url = new URL(params.endpoint);
  url.searchParams.set("verb", "ListRecords");

  if (params.resumptionToken) {
    url.searchParams.set("resumptionToken", params.resumptionToken);
  } else {
    url.searchParams.set("metadataPrefix", "oai_dc");
    if (params.from) {
      url.searchParams.set("from", formatOaiDate(params.from, params.granularity ?? "seconds"));
    }
    if (params.set) url.searchParams.set("set", params.set);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OAI-PMH request failed: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const parsed = parser.parse(xml);

  const error = parsed?.["OAI-PMH"]?.error;
  if (error) {
    const code = typeof error === "object" ? error["@_code"] : "error";
    const message = typeof error === "object" ? textOf(error) : String(error);
    if (code === "noRecordsMatch") {
      return { records: [], resumptionToken: null };
    }
    throw new Error(`OAI-PMH error [${code}]: ${message}`);
  }

  const listRecordsNode = parsed?.["OAI-PMH"]?.ListRecords;
  const rawRecords = toArray(listRecordsNode?.record);

  const records: OaiRecord[] = rawRecords.map((record: any) => {
    const header = record.header ?? {};
    const dcNode = record.metadata?.dc ?? {};
    const dc: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(dcNode)) {
      if (key.startsWith("@_")) continue;
      dc[key] = toArray(value).map(textOf);
    }

    return {
      identifier: textOf(header.identifier),
      datestamp: textOf(header.datestamp),
      deleted: header["@_status"] === "deleted",
      dc,
    };
  });

  const resumptionTokenNode = listRecordsNode?.resumptionToken;
  const resumptionToken =
    typeof resumptionTokenNode === "object" ? textOf(resumptionTokenNode) : resumptionTokenNode;

  return {
    records,
    resumptionToken: resumptionToken ? String(resumptionToken) : null,
  };
}

/** Drains every page of a ListRecords harvest, following resumptionTokens. */
export async function harvestAll(params: {
  endpoint: string;
  from?: string;
  set?: string;
  granularity?: OaiGranularity;
}): Promise<OaiRecord[]> {
  const drain = async (granularity: OaiGranularity) => {
    const all: OaiRecord[] = [];
    let resumptionToken: string | undefined;

    do {
      const page = await listRecords({ ...params, granularity, resumptionToken });
      all.push(...page.records);
      resumptionToken = page.resumptionToken ?? undefined;
    } while (resumptionToken);

    return all;
  };

  try {
    return await drain(params.granularity ?? "seconds");
  } catch (error) {
    // Repositories may advertise only day granularity (`YYYY-MM-DD`) and
    // reject a timestamped `from`. Fall back once before giving up.
    const message = (error as Error).message ?? "";
    if (params.from && message.includes("badArgument")) {
      return drain("date");
    }
    throw error;
  }
}
