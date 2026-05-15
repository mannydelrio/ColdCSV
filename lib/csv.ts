import Papa from "papaparse";
import type { ProspectRow } from "./anthropic";

const FIELD_MAP: Record<keyof ProspectRow, string[]> = {
  first_name: ["first_name", "firstname", "first name", "name"],
  company: ["company", "company_name", "organization"],
  role: ["role", "title", "job_title", "position"],
  linkedin_url: ["linkedin", "linkedin_url", "linkedin_profile"],
  notes: ["notes", "context", "custom", "additional_context"],
};

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h.includes(c));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

export interface ParseResult {
  rows: Record<string, string>[];
  columnMap: Partial<Record<keyof ProspectRow, string>>;
  headers: string[];
}

export function parseCSV(content: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const columnMap: Partial<Record<keyof ProspectRow, string>> = {};

  for (const [field, candidates] of Object.entries(FIELD_MAP) as [keyof ProspectRow, string[]][]) {
    const match = findColumn(headers, candidates);
    if (match) columnMap[field] = match;
  }

  return { rows: result.data, columnMap, headers };
}

export function extractProspect(
  row: Record<string, string>,
  columnMap: Partial<Record<keyof ProspectRow, string>>
): ProspectRow {
  return {
    first_name: columnMap.first_name ? row[columnMap.first_name] : undefined,
    company: columnMap.company ? row[columnMap.company] : undefined,
    role: columnMap.role ? row[columnMap.role] : undefined,
    linkedin_url: columnMap.linkedin_url ? row[columnMap.linkedin_url] : undefined,
    notes: columnMap.notes ? row[columnMap.notes] : undefined,
  };
}

export function buildCSV(
  rows: Record<string, string>[],
  headers: string[]
): string {
  const allHeaders = [...headers, "coldcsv_opening_line"];
  return Papa.unparse(rows, { columns: allHeaders });
}
