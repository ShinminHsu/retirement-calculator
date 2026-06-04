// Data model — persisted in localStorage under a single versioned key.
// All monetary values are in TWD unless a currency field says otherwise.

export type Currency = "TWD" | "USD";

export interface Position {
  id: string;
  account: string; // brokerage account label, e.g. "玉山證券"
  ticker: string; // e.g. "0050", "2330", "AAPL"
  shares: number;
  currency: Currency; // TWD for TW-listed, USD for US equities
}

export interface CashAccount {
  id: string;
  label: string; // e.g. "活存", "定存"
  amountTwd: number;
}

export interface SpendingCategory {
  id: string;
  label: string; // e.g. "居住"
  amount: number; // annual TWD
}

export interface IncomeBudget {
  annualIncome: number; // current annual income, TWD
  nominalRaiseRate: number; // e.g. 0.03 = 3% nominal raise per year
  workingSpending: number; // working-life annual spending total, TWD
  useCategories: boolean; // when true, workingSpending is derived from categories
  spendingCategories: SpendingCategory[];
  retirementSpendingOverride: number | null; // null => defaults to workingSpending
}

export interface Assumptions {
  currentAge: number;
  lifeExpectancyAge: number; // chart horizon, default 95
  nominalReturn: number; // investment nominal return, e.g. 0.07
  inflation: number; // e.g. 0.03
  realCashReturn: number; // real return on cash bucket, default 0
  withdrawalRate: number; // safe withdrawal rate, e.g. 0.04
  guaranteedMonthlyIncome: number; // 勞保+勞退 monthly, TWD, default 0
  useFixedDca: boolean; // when true, ignore income/spending and use fixedMonthlyDca
  fixedMonthlyDca: number; // TWD/month
  coastAge: number; // age used for the Coast FIRE metric, default 65
  returnVolatility: number; // annual real-return stdev for Monte Carlo, default 0.15
  monteCarloRuns: number; // number of simulations, default 1000
  withdrawalStrategy: WithdrawalStrategy; // default "fixed"
  guardrailBand: number; // ± band around planned rate, default 0.2
  guardrailAdjust: number; // spending change per breach, default 0.1
}

export type WithdrawalStrategy = "fixed" | "guardrails";

// One-off cashflow event in today's purchasing power.
// amount > 0 = inflow (bonus, inheritance); amount < 0 = outflow (down-payment).
export interface CashflowEvent {
  id: string;
  label: string;
  age: number;
  amount: number;
}

export interface QuoteEntry {
  price: number; // last known price in the symbol's own currency
  asOf: string; // ISO date string of the quote
  currency: Currency;
  manual: boolean; // true if user-entered override
}

export interface AppState {
  schemaVersion: number;
  positions: Position[];
  cashAccounts: CashAccount[];
  income: IncomeBudget;
  assumptions: Assumptions;
  cashflowEvents: CashflowEvent[];
  quoteCache: Record<string, QuoteEntry>; // keyed by ticker
  usdTwdRate: number; // USD -> TWD, manual override allowed
}

export const SCHEMA_VERSION = 1;

export function defaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    positions: [],
    cashAccounts: [],
    income: {
      annualIncome: 1_000_000,
      nominalRaiseRate: 0.03,
      workingSpending: 600_000,
      useCategories: false,
      spendingCategories: [],
      retirementSpendingOverride: null,
    },
    assumptions: {
      currentAge: 30,
      lifeExpectancyAge: 95,
      nominalReturn: 0.07,
      inflation: 0.03,
      realCashReturn: 0,
      withdrawalRate: 0.04,
      guaranteedMonthlyIncome: 0,
      useFixedDca: false,
      fixedMonthlyDca: 30_000,
      coastAge: 65,
      returnVolatility: 0.15,
      monteCarloRuns: 1000,
      withdrawalStrategy: "fixed",
      guardrailBand: 0.2,
      guardrailAdjust: 0.1,
    },
    cashflowEvents: [],
    quoteCache: {},
    usdTwdRate: 32,
  };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
