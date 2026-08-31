// DHIS2 aggregate push: sends a statutory report's figures for one
// calendar month to a DHIS2 server's /api/dataValueSets endpoint. Config
// comes entirely from environment variables (same approach as the backup
// module — see src/lib/backup.ts), and because every DHIS2 instance mints
// its own data-element / category-option-combo UIDs, a hand-authored JSON
// file (DHIS2_MAPPING_PATH) maps this app's stable report-cell codes to
// those UIDs. Cells with no mapping entry are skipped and reported back.
// See README.md > DHIS2 integration.
import { readFileSync } from "node:fs";
import path from "node:path";

export class Dhis2Error extends Error {}

export type Dhis2ReportKey = "opd-attendance" | "opd-morbidity" | "inpatient";

export interface Dhis2Config {
  /** Base URL, trailing slash stripped (no `/api`). */
  url: string;
  auth:
    | { type: "token"; token: string }
    | { type: "basic"; username: string; password: string };
  orgUnit: string;
  /** Optional dataSet UID; when set, the push marks it complete for the period. */
  dataset?: string;
  /** categoryOptionCombo UID used when a mapping entry doesn't name one. */
  defaultCoc?: string;
  /** DHIS2 dryRun — validate without persisting. */
  dryRun: boolean;
  /** Send cells whose value is 0 (default: skip them). */
  includeZeros: boolean;
  mappingPath: string;
}

interface CellTarget {
  dataElement: string;
  categoryOptionCombo?: string;
}
type CellMap = Record<string, CellTarget>;
export type Dhis2Mapping = Record<Dhis2ReportKey, CellMap>;

export interface Dhis2PushResult {
  ok: boolean;
  status: string; // SUCCESS | WARNING | ERROR
  dryRun: boolean;
  counts: { imported: number; updated: number; ignored: number; deleted: number };
  /** Cells that had a mapping entry and were sent. */
  mapped: number;
  /** Cell codes with no mapping entry (not sent). */
  skipped: string[];
  conflicts: { object?: string; value: string }[];
}

const bool = (v: string | undefined) => v === "true" || v === "1";

/**
 * Reads the DHIS2 connection settings from the environment. Returns `null`
 * unless the integration is fully configured — a base URL, credentials
 * (token or username+password) and an org unit UID.
 */
export function getDhis2Config(): Dhis2Config | null {
  const rawUrl = process.env.DHIS2_URL?.trim();
  const orgUnit = process.env.DHIS2_ORG_UNIT?.trim();
  if (!rawUrl || !orgUnit) return null;

  const token = process.env.DHIS2_TOKEN?.trim();
  const username = process.env.DHIS2_USERNAME?.trim();
  const password = process.env.DHIS2_PASSWORD ?? "";
  const auth: Dhis2Config["auth"] | null = token
    ? { type: "token", token }
    : username
      ? { type: "basic", username, password }
      : null;
  if (!auth) return null;

  return {
    url: rawUrl.replace(/\/+$/, ""),
    auth,
    orgUnit,
    dataset: process.env.DHIS2_DATASET?.trim() || undefined,
    defaultCoc: process.env.DHIS2_DEFAULT_COC?.trim() || undefined,
    dryRun: bool(process.env.DHIS2_DRY_RUN),
    includeZeros: bool(process.env.DHIS2_INCLUDE_ZEROS),
    mappingPath: process.env.DHIS2_MAPPING_PATH?.trim() || "./config/dhis2-mapping.json",
  };
}

export function loadDhis2Mapping(mappingPath: string): Dhis2Mapping {
  const abs = path.isAbsolute(mappingPath)
    ? mappingPath
    : path.join(process.cwd(), mappingPath);
  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    throw new Dhis2Error(
      `DHIS2 mapping file not found at ${abs}. Copy config/dhis2-mapping.example.json and fill in your instance's UIDs.`
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Dhis2Error(`DHIS2 mapping file at ${abs} is not valid JSON.`);
  }
  const obj = (parsed ?? {}) as Partial<Dhis2Mapping>;
  return {
    "opd-attendance": obj["opd-attendance"] ?? {},
    "opd-morbidity": obj["opd-morbidity"] ?? {},
    inpatient: obj["inpatient"] ?? {},
  };
}

/**
 * Returns the DHIS2 monthly period ("YYYYMM") when `[from, toInclusive]`
 * spans exactly one whole calendar month, otherwise `null`. DHIS2 monthly
 * datasets are keyed by period, so a partial or multi-month range can't be
 * pushed unambiguously.
 */
export function periodFromRange(from: Date, toInclusive: Date): string | null {
  if (Number.isNaN(from.getTime()) || Number.isNaN(toInclusive.getTime())) return null;
  const firstOfMonth = from.getDate() === 1;
  const lastOfMonth =
    toInclusive.getDate() ===
    new Date(toInclusive.getFullYear(), toInclusive.getMonth() + 1, 0).getDate();
  const sameMonth =
    from.getFullYear() === toInclusive.getFullYear() &&
    from.getMonth() === toInclusive.getMonth();
  if (!firstOfMonth || !lastOfMonth || !sameMonth) return null;
  return `${from.getFullYear()}${String(from.getMonth() + 1).padStart(2, "0")}`;
}

function authHeader(auth: Dhis2Config["auth"]): string {
  if (auth.type === "token") return `ApiToken ${auth.token}`;
  const b64 = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
  return `Basic ${b64}`;
}

interface DhisImportCount {
  imported?: number;
  updated?: number;
  ignored?: number;
  deleted?: number;
}
interface DhisResponseBody {
  status?: string;
  httpStatus?: string;
  message?: string;
  importCount?: DhisImportCount;
  conflicts?: { object?: string; value?: string }[];
  response?: {
    status?: string;
    importCount?: DhisImportCount;
    conflicts?: { object?: string; value?: string }[];
  };
}

export async function pushDataValueSet(args: {
  reportKey: Dhis2ReportKey;
  period: string;
  cells: { code: string; value: number }[];
}): Promise<Dhis2PushResult> {
  const config = getDhis2Config();
  if (!config) {
    throw new Dhis2Error(
      "DHIS2 is not configured. Set DHIS2_URL, DHIS2_TOKEN (or DHIS2_USERNAME/DHIS2_PASSWORD) and DHIS2_ORG_UNIT in .env."
    );
  }
  const mapping = loadDhis2Mapping(config.mappingPath)[args.reportKey];

  const dataValues: Record<string, string>[] = [];
  const skipped: string[] = [];
  for (const cell of args.cells) {
    const target = mapping[cell.code];
    if (!target) {
      skipped.push(cell.code);
      continue;
    }
    if (cell.value === 0 && !config.includeZeros) continue;
    const coc = target.categoryOptionCombo ?? config.defaultCoc;
    dataValues.push({
      dataElement: target.dataElement,
      value: String(cell.value),
      ...(coc ? { categoryOptionCombo: coc } : {}),
    });
  }

  if (dataValues.length === 0) {
    throw new Dhis2Error(
      `Nothing to push: none of the ${args.cells.length} report cells for this period are present in the DHIS2 mapping file (${config.mappingPath}).`
    );
  }

  const body: Record<string, unknown> = {
    orgUnit: config.orgUnit,
    period: args.period,
    dataValues,
  };
  if (config.dataset) {
    body.dataSet = config.dataset;
    body.completeDate = new Date().toISOString().slice(0, 10);
  }

  const endpoint =
    `${config.url}/api/dataValueSets?importStrategy=CREATE_AND_UPDATE` +
    `&dryRun=${config.dryRun ? "true" : "false"}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader(config.auth),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    throw new Dhis2Error(`Could not reach DHIS2 at ${config.url}: ${reason}`);
  }

  const text = await res.text();
  let parsed: DhisResponseBody = {};
  try {
    parsed = text ? (JSON.parse(text) as DhisResponseBody) : {};
  } catch {
    // fall through — handled by the !res.ok check below
  }

  if (!res.ok) {
    const detail = parsed.message || text.slice(0, 300) || res.statusText;
    throw new Dhis2Error(`DHIS2 rejected the import (HTTP ${res.status}): ${detail}`);
  }

  const inner = parsed.response ?? parsed;
  const status = (inner.status || parsed.status || "SUCCESS").toUpperCase();
  const ic = inner.importCount ?? {};
  const conflicts = (inner.conflicts ?? []).map((c) => ({
    object: c.object,
    value: c.value ?? "",
  }));

  if (status === "ERROR") {
    const first = conflicts[0]?.value;
    throw new Dhis2Error(
      `DHIS2 import failed${first ? `: ${first}` : parsed.message ? `: ${parsed.message}` : "."}`
    );
  }

  return {
    ok: true,
    status,
    dryRun: config.dryRun,
    counts: {
      imported: ic.imported ?? 0,
      updated: ic.updated ?? 0,
      ignored: ic.ignored ?? 0,
      deleted: ic.deleted ?? 0,
    },
    mapped: dataValues.length,
    skipped,
    conflicts,
  };
}
