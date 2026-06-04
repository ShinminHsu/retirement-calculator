import { Currency, QuoteEntry } from "../types";

// QuoteProvider strategy: auto-fetch Taiwan-listed previous-day close from the
// CORS-permitting TWSE OpenAPI, with manual price override as a first-class
// fallback. No third-party proxy, no intraday source (see design.md).

// Requests go through the Vite dev-server proxy (see vite.config.ts) to avoid
// browser CORS. In a static prod build without the proxy these paths 404 and
// the app falls back to manual price entry.
const TWSE_STOCK_DAY_ALL = "/proxy/twse/v1/exchangeReport/STOCK_DAY_ALL"; // 上市
const TPEX_DAILY_CLOSE =
  "/proxy/tpex/openapi/v1/tpex_mainboard_daily_close_quotes"; // 上櫃
const FX_URL = "/proxy/fx/v6/latest/USD";
const STOOQ_URL = "/proxy/stooq/q/l/"; // US equities, CSV

interface TwseRow {
  Code: string;
  ClosingPrice: string;
  Date: string; // ROC date, e.g. "1150604" => 2026-06-04
}

// US tickers are letters only (BND, QQQ); TWSE codes always contain a digit
// (0050, 2330, 00631L). Used to pick the right quote source automatically.
export function detectCurrency(ticker: string): Currency {
  return /\d/.test(ticker) ? "TWD" : "USD";
}

// Convert a TWSE ROC date string (YYYMMDD, year in 民國) to ISO yyyy-mm-dd.
function rocToIso(roc: string): string | null {
  if (!/^\d{7}$/.test(roc)) return null;
  const year = parseInt(roc.slice(0, 3), 10) + 1911;
  return `${year}-${roc.slice(3, 5)}-${roc.slice(5, 7)}`;
}

export interface RefreshResult {
  quotes: Record<string, QuoteEntry>; // ticker -> entry (auto-fetched only)
  unavailable: string[]; // tickers we could not auto-fetch (need manual)
  usdTwdRate: number | null; // null if FX fetch failed
  error: string | null;
}

interface TwseClose {
  price: number;
  asOf: string;
}

interface TpexRow {
  SecuritiesCompanyCode: string;
  Close: string;
  Date: string; // ROC date
}

// Fetch the full TWSE (上市) daily-close table once and index by stock code.
async function fetchTwseCloseMap(fallbackAsOf: string): Promise<Map<string, TwseClose>> {
  const res = await fetch(TWSE_STOCK_DAY_ALL);
  if (!res.ok) throw new Error(`TWSE ${res.status}`);
  const rows = (await res.json()) as TwseRow[];
  const map = new Map<string, TwseClose>();
  for (const r of rows) {
    const price = parseFloat(r.ClosingPrice);
    if (r.Code && isFinite(price)) {
      map.set(r.Code, { price, asOf: rocToIso(r.Date) ?? fallbackAsOf });
    }
  }
  return map;
}

// Fetch the TPEx (上櫃) daily-close table once and index by stock code.
async function fetchTpexCloseMap(fallbackAsOf: string): Promise<Map<string, TwseClose>> {
  const res = await fetch(TPEX_DAILY_CLOSE);
  if (!res.ok) throw new Error(`TPEx ${res.status}`);
  const rows = (await res.json()) as TpexRow[];
  const map = new Map<string, TwseClose>();
  for (const r of rows) {
    const price = parseFloat(r.Close);
    if (r.SecuritiesCompanyCode && isFinite(price)) {
      map.set(r.SecuritiesCompanyCode, {
        price,
        asOf: rocToIso(r.Date) ?? fallbackAsOf,
      });
    }
  }
  return map;
}

// Fetch US-equity closes from Stooq in a single batch CSV request.
// CSV columns: Symbol,Date,Open,High,Low,Close,Volume
async function fetchStooqCloseMap(
  tickers: string[],
): Promise<Map<string, TwseClose>> {
  const map = new Map<string, TwseClose>();
  if (tickers.length === 0) return map;
  // Stooq batches symbols separated by "+". Don't URL-encode it — encoding the
  // "+" to %2B makes Stooq treat the whole string as one bad symbol. Tickers are
  // alphanumeric + "." so they need no escaping.
  const symbols = tickers.map((t) => `${t.toLowerCase()}.us`).join("+");
  const res = await fetch(`${STOOQ_URL}?s=${symbols}&f=sd2ohlcv&e=csv`);
  if (!res.ok) throw new Error(`Stooq ${res.status}`);
  const text = await res.text();
  for (const line of text.trim().split("\n")) {
    const cols = line.split(",");
    if (cols.length < 6) continue;
    const sym = cols[0].replace(/\.US$/i, "").toUpperCase();
    const date = cols[1];
    const close = parseFloat(cols[5]);
    if (sym && isFinite(close)) {
      map.set(sym, { price: close, asOf: /\d{4}-\d{2}-\d{2}/.test(date) ? date : "" });
    }
  }
  return map;
}

async function fetchUsdTwd(): Promise<number | null> {
  try {
    const res = await fetch(FX_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { TWD?: number } };
    const twd = data.rates?.TWD;
    return typeof twd === "number" && isFinite(twd) ? twd : null;
  } catch {
    return null;
  }
}

// Refresh quotes for the given distinct tickers. Each ticker is looked up once.
// TWD tickers resolve against the TWSE close map; non-TWD (e.g. USD) tickers are
// not auto-fetched and are returned as unavailable for manual entry.
export async function refreshQuotes(
  tickers: { ticker: string; currency: Currency }[],
): Promise<RefreshResult> {
  const asOf = new Date().toISOString().slice(0, 10);
  const quotes: Record<string, QuoteEntry> = {};
  const unavailable: string[] = [];

  // Deduplicate by ticker, deriving the effective currency from the ticker
  // pattern (TWSE codes contain digits; US tickers are letters only). This is
  // robust even if the user left the 台股/美股 dropdown on its default.
  const distinct = new Map<string, Currency>();
  for (const t of tickers) {
    if (!t.ticker || distinct.has(t.ticker)) continue;
    distinct.set(t.ticker, detectCurrency(t.ticker));
  }

  let usdTwdRate: number | null = null;
  let error: string | null = null;

  const needsFx = [...distinct.values()].includes("USD");
  if (needsFx) usdTwdRate = await fetchUsdTwd();

  const errors: string[] = [];

  // Taiwan equities: fetch 上市 (TWSE) and 上櫃 (TPEx) in parallel, look up TWSE
  // first then TPEx. A failure in one source doesn't block the other.
  let twseMap: Map<string, TwseClose> | null = null;
  let tpexMap: Map<string, TwseClose> | null = null;
  if ([...distinct.values()].includes("TWD")) {
    const [twseRes, tpexRes] = await Promise.allSettled([
      fetchTwseCloseMap(asOf),
      fetchTpexCloseMap(asOf),
    ]);
    if (twseRes.status === "fulfilled") twseMap = twseRes.value;
    else errors.push("上市報價連線失敗");
    if (tpexRes.status === "fulfilled") tpexMap = tpexRes.value;
    else errors.push("上櫃報價連線失敗");
  }

  let stooqMap: Map<string, TwseClose> | null = null;
  const usdTickers = [...distinct.entries()]
    .filter(([, c]) => c === "USD")
    .map(([t]) => t);
  try {
    if (usdTickers.length > 0) {
      stooqMap = await fetchStooqCloseMap(usdTickers);
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "美股報價連線失敗");
  }

  for (const [ticker, currency] of distinct) {
    const close =
      currency === "USD"
        ? stooqMap?.get(ticker)
        : (twseMap?.get(ticker) ?? tpexMap?.get(ticker)); // 上市 then 上櫃
    if (close !== undefined) {
      quotes[ticker] = {
        price: close.price,
        asOf: close.asOf || asOf,
        currency,
        manual: false,
      };
    } else {
      unavailable.push(ticker); // not found / source down -> manual
    }
  }

  if (errors.length) error = errors.join("；");

  return { quotes, unavailable, usdTwdRate, error };
}
