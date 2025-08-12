// Read CSV from a Google Sheet and parse it (no external deps)
// Usage (public sheet): set SHEET_ID (and optional SHEET_GID) env vars, then run `bun run index.ts`

import { getPrisma } from "./libs/utils";
import { extractShopifyProducts } from "./shopify";

const prisma = getPrisma();

type RowObject = Record<string, string>;

function googleSheetCsvUrl(spreadsheetId: string, gid?: string | number) {
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    spreadsheetId
  )}/export?format=csv`;
  return typeof gid !== "undefined" ? `${base}&gid=${gid}` : base;
}

async function fetchGoogleSheetCsv(
  spreadsheetId: string,
  options?: { gid?: string | number; signal?: AbortSignal }
): Promise<string> {
  const url = googleSheetCsvUrl(spreadsheetId, options?.gid);
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch Google Sheet CSV (HTTP ${res.status}). Ensure the sheet or specific tab is public or published. URL: ${url}\n${text}`
    );
  }
  return await res.text();
}

// Minimal CSV parser supporting commas, quotes, and double-quote escapes
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = csv.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          cell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cell += ch;
      }
    }
  }
  // flush last cell/row
  row.push(cell);
  rows.push(row);
  // Drop trailing empty row if file ends with newline
  const last = rows[rows.length - 1];
  if (last && last.length === 1 && last[0] === "") {
    rows.pop();
  }
  return rows;
}

function csvToObjects(rows: string[][]): RowObject[] {
  if (rows.length === 0) return [];
  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((h) => (h ?? "").trim());
  const out: RowObject[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const obj: RowObject = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j] || `col_${j + 1}`;
      obj[key] = r[j] ?? "";
    }
    out.push(obj);
  }
  return out;
}

export async function readGoogleSheetAsObjects(args: {
  spreadsheetId: string;
  gid?: string | number; // Sheet/tab id (optional). If omitted, first sheet is exported.
  signal?: AbortSignal;
}) {
  const csv = await fetchGoogleSheetCsv(args.spreadsheetId, {
    gid: args.gid,
    signal: args.signal,
  });
  const rows = parseCsv(csv);
  return csvToObjects(rows) as {
    Title: string;
    "Product Link": string;
    "Image Link": string;
    "Affiliate Link": string;
  }[];
}

// Demo: run if env vars are provided
const SHEET_ID = process.env.SHEET_ID;
const SHEET_GID = process.env.SHEET_GID; // optional, overrides gid in URL

function parseSheetInput(input: string): { id: string; gid?: string } {
  let id = input.trim();
  let gid: string | undefined;
  if (/^https?:\/\//i.test(id)) {
    try {
      const u = new URL(id);
      const m = u.pathname.match(/\/spreadsheets\/d\/([\w-]+)/);
      if (m && m[1]) id = m[1];
      const qgid = u.searchParams.get("gid");
      if (qgid) gid = qgid;
      if (!gid && u.hash) {
        const h = u.hash.match(/gid=(\d+)/);
        if (h) gid = h[1];
      }
    } catch {
      // leave as-is if parsing fails
    }
  }
  return { id, gid };
}

function readDataFromGSheet() {
  if (SHEET_ID) {
    const { id, gid } = parseSheetInput(SHEET_ID);
    const effectiveGid = SHEET_GID ?? gid;
    readGoogleSheetAsObjects({ spreadsheetId: id, gid: effectiveGid })
      .then(async (data) => {
        const result = await prisma.sheetProduct.createMany({
          data: data.map((product) => ({
            Title: product.Title,
            AffiliateLink: product["Affiliate Link"],
            ProductLink: product["Product Link"],
            ImageLink: product["Image Link"],
          })),
        });
        console.log(`Added ${result.count} products.`);
      })
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  } else {
    console.log("Set SHEET_ID env var to fetch a Google Sheet as CSV.");
    console.log(
      "Tip: Use gid=<tab id> if you want a specific sheet/tab. Example run: SHEET_ID=YOUR_ID SHEET_GID=0 bun run index.ts"
    );
  }
}

// (Shopify helper types/functions removed; logic consolidated into extractProductsFromShopify)

// Entry point: prioritize Shopify fetch if env is set; else keep previous demo
(async () => {
  const hasShopify = Boolean(process.env.SHOPIFY_SHOP && process.env.SHOPIFY_ACCESS_TOKEN);
  if (hasShopify || true) {
    await extractShopifyProducts();
  } else {
  readDataFromGSheet();
  }
})();