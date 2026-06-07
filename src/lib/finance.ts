import {
  AppState,
  Assumptions,
  IncomeBudget,
  Position,
  QuoteEntry,
} from "../types";

// ---------- nominal <-> real ----------

// Convert a nominal rate to a real (inflation-adjusted) rate.
export function toReal(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

// ---------- portfolio valuation ----------

export interface PositionValue {
  position: Position;
  price: number | null; // in the symbol's own currency
  valueTwd: number | null;
  priceAvailable: boolean;
}

export function valuePosition(
  position: Position,
  quote: QuoteEntry | undefined,
  usdTwdRate: number,
): PositionValue {
  if (!quote || !isFinite(quote.price)) {
    return { position, price: null, valueTwd: null, priceAvailable: false };
  }
  const raw = quote.price * position.shares;
  const valueTwd = quote.currency === "USD" ? raw * usdTwdRate : raw;
  return {
    position,
    price: quote.price,
    valueTwd,
    priceAvailable: true,
  };
}

export interface TickerSummary {
  ticker: string;
  totalShares: number;
  currency: string;
  valueTwd: number | null;
}

export interface PortfolioSummary {
  positionValues: PositionValue[];
  byTicker: TickerSummary[];
  byAccount: { account: string; valueTwd: number }[];
  investedTwd: number; // sum of valued positions (unavailable treated as 0)
  cashTwd: number;
  netWorthTwd: number;
  hasUnavailable: boolean;
}

export function summarizePortfolio(state: AppState): PortfolioSummary {
  const { positions, cashAccounts, quoteCache, usdTwdRate } = state;
  const positionValues = positions.map((p) =>
    valuePosition(p, quoteCache[p.ticker], usdTwdRate),
  );

  // Aggregate by ticker.
  const tickerMap = new Map<string, TickerSummary>();
  for (const pv of positionValues) {
    const t = pv.position.ticker;
    const existing = tickerMap.get(t);
    if (existing) {
      existing.totalShares += pv.position.shares;
      if (pv.valueTwd !== null) {
        existing.valueTwd = (existing.valueTwd ?? 0) + pv.valueTwd;
      }
    } else {
      tickerMap.set(t, {
        ticker: t,
        totalShares: pv.position.shares,
        currency: pv.position.currency,
        valueTwd: pv.valueTwd,
      });
    }
  }

  // Aggregate by account.
  const accountMap = new Map<string, number>();
  for (const pv of positionValues) {
    const prev = accountMap.get(pv.position.account) ?? 0;
    accountMap.set(pv.position.account, prev + (pv.valueTwd ?? 0));
  }

  const investedTwd = positionValues.reduce(
    (sum, pv) => sum + (pv.valueTwd ?? 0),
    0,
  );
  const cashTwd = cashAccounts.reduce((sum, c) => sum + (c.amountTwd || 0), 0);

  return {
    positionValues,
    byTicker: [...tickerMap.values()],
    byAccount: [...accountMap.entries()].map(([account, valueTwd]) => ({
      account,
      valueTwd,
    })),
    investedTwd,
    cashTwd,
    netWorthTwd: investedTwd + cashTwd,
    hasUnavailable: positionValues.some((pv) => !pv.priceAvailable),
  };
}

// ---------- income & budget ----------

export function workingSpending(income: IncomeBudget): number {
  if (income.useCategories) {
    return income.spendingCategories.reduce((s, c) => s + (c.amount || 0), 0);
  }
  return income.workingSpending || 0;
}

export function retirementSpending(income: IncomeBudget): number {
  return income.retirementSpendingOverride ?? workingSpending(income);
}

// ---------- retirement target (floor-and-upside) ----------

// Total guaranteed annual income once every stream (勞保 + 勞退) is flowing.
export function annualGuaranteedIncome(a: Assumptions): number {
  return ((a.laborPensionMonthly || 0) + (a.laborInsuranceMonthly || 0)) * 12;
}

export interface GuaranteedStream {
  annual: number;
  startAge: number;
}

export function guaranteedStreams(a: Assumptions): GuaranteedStream[] {
  return [
    { annual: (a.laborPensionMonthly || 0) * 12, startAge: a.laborPensionStartAge ?? 60 },
    { annual: (a.laborInsuranceMonthly || 0) * 12, startAge: a.laborInsuranceStartAge ?? 65 },
  ];
}

// Guaranteed income flowing at a given age (sum of streams already started).
export function guaranteedIncomeAtAge(streams: GuaranteedStream[], age: number): number {
  return streams.reduce((s, x) => s + (age >= x.startAge ? x.annual : 0), 0);
}

// gap = retirement spending - guaranteed income; target = gap / withdrawal rate.
export function retirementTarget(state: AppState): number {
  const gap = retirementSpending(state.income) - annualGuaranteedIncome(state.assumptions);
  if (gap <= 0) return 0; // guaranteed income already covers spending
  return gap / state.assumptions.withdrawalRate;
}

// ---------- projection ----------

export interface ProjectionPoint {
  age: number;
  netWorth: number;
  invested: number;
  cash: number;
  phase: "accumulation" | "decumulation";
}

export interface ProjectionResult {
  series: ProjectionPoint[];
  target: number;
  retirementAge: number | null; // null => target not reached within horizon
  yearsToRetire: number | null;
  shortfall: number; // > 0 only when target not reached
  depletionAge: number | null; // age portfolio hits 0 during decumulation
  startNetWorth: number;
}

// Inputs shared by the deterministic and Monte Carlo runs, computed once.
export interface SimContext {
  startInvested: number;
  startCash: number;
  target: number;
  rCash: number;
  realRaise: number;
  baseSpending: number;
  retSpend: number; // full retirement spending (before guaranteed income)
  gap: number; // retSpend - guaranteed income (steady-state self-funded need)
  fullGuaranteed: number; // guaranteed income per year once every stream is flowing
  streams: GuaranteedStream[]; // 勞保/勞退, each with its own start age
  eventsByAge: Map<number, number>; // age -> net signed amount
  annualSavings: (yearsElapsed: number) => number;
  currentAge: number;
  endAge: number;
  withdrawalStrategy: "fixed" | "guardrails";
  plannedRate: number; // planned withdrawal rate, guardrail reference
  guardrailBand: number;
  guardrailAdjust: number;
}

export function buildSimContext(state: AppState): SimContext {
  const a = state.assumptions;
  const summary = summarizePortfolio(state);
  const realRaise = toReal(state.income.nominalRaiseRate, a.inflation);
  const baseSpending = workingSpending(state.income);

  const eventsByAge = new Map<number, number>();
  for (const ev of state.cashflowEvents) {
    eventsByAge.set(ev.age, (eventsByAge.get(ev.age) ?? 0) + (ev.amount || 0));
  }

  return {
    startInvested: summary.investedTwd,
    startCash: summary.cashTwd,
    target: retirementTarget(state),
    rCash: a.realCashReturn,
    realRaise,
    baseSpending,
    retSpend: retirementSpending(state.income),
    gap: Math.max(0, retirementSpending(state.income) - annualGuaranteedIncome(a)),
    fullGuaranteed: annualGuaranteedIncome(a),
    streams: guaranteedStreams(a),
    eventsByAge,
    annualSavings: (yearsElapsed: number) =>
      a.useFixedDca
        ? a.fixedMonthlyDca * 12
        : state.income.annualIncome * Math.pow(1 + realRaise, yearsElapsed) -
          baseSpending,
    currentAge: a.currentAge,
    endAge: Math.max(a.lifeExpectancyAge, a.currentAge + 1),
    withdrawalStrategy: a.withdrawalStrategy ?? "fixed",
    plannedRate: a.withdrawalRate,
    guardrailBand: a.guardrailBand ?? 0.2,
    guardrailAdjust: a.guardrailAdjust ?? 0.1,
  };
}

export interface SimResult {
  series: ProjectionPoint[];
  retirementAge: number | null;
  depletionAge: number | null;
  finalNet: number;
}

// One full accumulation→decumulation path. `rInvestForYear` supplies the real
// investment return for each year (constant for deterministic, sampled for MC).
export function simulatePath(
  ctx: SimContext,
  rInvestForYear: (yearsElapsed: number) => number,
  collectSeries: boolean,
): SimResult {
  let invested = ctx.startInvested;
  let cash = ctx.startCash;
  let spending = ctx.gap; // current retirement spending (adapts under guardrails)
  const series: ProjectionPoint[] = [];
  let retirementAge: number | null = null;
  let depletionAge: number | null = null;
  let depleted = false;

  for (let age = ctx.currentAge; age <= ctx.endAge; age++) {
    const netStart = invested + cash;
    // Retiring before a guaranteed-income stream starts means self-funding that
    // stream's worth of spending until it begins, so the nest egg needed is the
    // steady-state target plus each stream's un-covered amount per bridge year.
    const bridgeCost = ctx.streams.reduce(
      (s, x) => s + x.annual * Math.max(0, x.startAge - age),
      0,
    );
    const needNow = ctx.target + bridgeCost;
    if (retirementAge === null && netStart >= needNow) retirementAge = age;
    const retired = retirementAge !== null;

    if (collectSeries) {
      series.push({
        age,
        netWorth: Math.max(0, netStart),
        invested: Math.max(0, invested),
        cash: Math.max(0, cash),
        phase: retired ? "decumulation" : "accumulation",
      });
    }

    if (depleted) {
      invested = 0;
      cash = 0;
      continue;
    }

    const r = rInvestForYear(age - ctx.currentAge);
    invested *= 1 + r;
    cash *= 1 + ctx.rCash;

    if (!retired) {
      invested += ctx.annualSavings(age - ctx.currentAge);
    } else {
      // Guaranteed income (勞保/勞退) flowing at this age; whatever portion of
      // the full guaranteed income hasn't started yet must be self-funded.
      const guaranteedNow = guaranteedIncomeAtAge(ctx.streams, age);
      const uncovered = Math.max(0, ctx.fullGuaranteed - guaranteedNow);
      let steadySpend: number;
      if (ctx.withdrawalStrategy === "guardrails" && ctx.gap > 0) {
        // Guardrails: adjust this year's spending from the implied withdrawal
        // rate vs the planned rate before withdrawing (Guyton-Klinger style).
        const portfolio = invested + cash;
        const impliedRate = portfolio > 0 ? spending / portfolio : Infinity;
        const upper = ctx.plannedRate * (1 + ctx.guardrailBand);
        const lower = ctx.plannedRate * (1 - ctx.guardrailBand);
        if (impliedRate > upper) spending *= 1 - ctx.guardrailAdjust;
        else if (impliedRate < lower) spending *= 1 + ctx.guardrailAdjust;
        steadySpend = spending;
      } else {
        spending = ctx.gap; // fixed strategy
        steadySpend = spending;
      }
      // steady gap covers spend once everything flows; add the not-yet-started
      // streams during the bridge years.
      const thisYearWithdraw = steadySpend + uncovered;
      const unmet = drawDown(thisYearWithdraw, () => [invested, cash], (i, c) => {
        invested = i;
        cash = c;
      });
      if (unmet > 0 && depletionAge === null) {
        depletionAge = age;
        depleted = true;
        invested = 0;
        cash = 0;
        continue;
      }
    }

    // Apply one-off cashflow events for this age.
    const ev = ctx.eventsByAge.get(age) ?? 0;
    if (ev > 0) {
      invested += ev;
    } else if (ev < 0) {
      const unmet = drawDown(-ev, () => [invested, cash], (i, c) => {
        invested = i;
        cash = c;
      });
      if (unmet > 0 && retired && depletionAge === null) {
        depletionAge = age;
        depleted = true;
      }
    }

    if (invested < 0) invested = 0;
    if (cash < 0) cash = 0;
  }

  return { series, retirementAge, depletionAge, finalNet: invested + cash };
}

// Withdraw `amount` from investments first then cash. Returns the unmet remainder.
function drawDown(
  amount: number,
  get: () => [number, number],
  set: (invested: number, cash: number) => void,
): number {
  let [invested, cash] = get();
  let need = amount;
  const fromInvest = Math.min(Math.max(0, invested), need);
  invested -= fromInvest;
  need -= fromInvest;
  if (need > 0) {
    const fromCash = Math.min(Math.max(0, cash), need);
    cash -= fromCash;
    need -= fromCash;
  }
  set(invested, cash);
  return need;
}

export function project(state: AppState): ProjectionResult {
  const ctx = buildSimContext(state);
  const rInvest = toReal(state.assumptions.nominalReturn, state.assumptions.inflation);
  const sim = simulatePath(ctx, () => rInvest, true);
  const reached = sim.retirementAge !== null;
  return {
    series: sim.series,
    target: ctx.target,
    retirementAge: sim.retirementAge,
    yearsToRetire: reached ? sim.retirementAge! - ctx.currentAge : null,
    shortfall: reached ? 0 : Math.max(0, ctx.target - sim.finalNet),
    depletionAge: sim.depletionAge,
    startNetWorth: ctx.startInvested + ctx.startCash,
  };
}

// ---------- Coast FIRE ----------

export interface CoastFire {
  coastNumber: number; // investments needed today to coast to target by coastAge
  invested: number; // current investment bucket
  reached: boolean;
  shortfall: number; // > 0 when not reached
  ageReachesTarget: number | null; // age current investments alone hit the target
}

// Coast FIRE: the amount that, with no further contributions, grows at the real
// return to reach the target by coastAge. coastNumber = target / (1+r)^years.
export function coastFire(state: AppState): CoastFire {
  const a = state.assumptions;
  const rInvest = toReal(a.nominalReturn, a.inflation);
  const target = retirementTarget(state);
  const invested = summarizePortfolio(state).investedTwd;

  const yearsToCoast = Math.max(0, a.coastAge - a.currentAge);
  const coastNumber =
    rInvest > -1 ? target / Math.pow(1 + rInvest, yearsToCoast) : target;

  let ageReachesTarget: number | null = null;
  if (invested >= target) {
    ageReachesTarget = a.currentAge;
  } else if (invested > 0 && rInvest > 0 && target > 0) {
    const n = Math.log(target / invested) / Math.log(1 + rInvest);
    ageReachesTarget = a.currentAge + Math.ceil(n);
  }

  return {
    coastNumber,
    invested,
    reached: invested >= coastNumber,
    shortfall: Math.max(0, coastNumber - invested),
    ageReachesTarget,
  };
}

// ---------- calculation breakdown (transparency) ----------

export interface BreakdownStep {
  label: string;
  formula: string; // formula with the user's actual numbers plugged in
  result: string; // formatted result
  note?: string;
}

export interface BreakdownYear {
  age: number;
  startInvested: number;
  startCash: number;
  startNetWorth: number;
  flow: number; // savings added (+) or withdrawal taken (−) that year
  phase: "accumulation" | "decumulation";
}

export interface Breakdown {
  steps: BreakdownStep[];
  years: BreakdownYear[];
}

const f0 = (n: number) => Math.round(n).toLocaleString("zh-TW");
const fp = (frac: number) => `${(frac * 100).toFixed(2)}%`;

// Build a human-readable, step-by-step derivation of the headline numbers,
// using the user's actual inputs. Mirrors the math in retirementTarget/project.
export function buildBreakdown(state: AppState): Breakdown {
  const a = state.assumptions;
  const summary = summarizePortfolio(state);
  const result = project(state);

  const retSpend = retirementSpending(state.income);
  const guaranteedAnnual = annualGuaranteedIncome(a);
  const gap = Math.max(0, retSpend - guaranteedAnnual);
  const rInvest = toReal(a.nominalReturn, a.inflation);
  const realRaise = toReal(state.income.nominalRaiseRate, a.inflation);
  const baseSpending = workingSpending(state.income);

  const steps: BreakdownStep[] = [];

  steps.push({
    label: "1. 目前淨值",
    formula: `投資 ${f0(summary.investedTwd)} + 現金 ${f0(summary.cashTwd)}`,
    result: `${f0(summary.netWorthTwd)} 元`,
    note: "投資部位＝各持股股數 × 收盤價（美股再乘匯率）；現金＝各帳戶加總。",
  });

  steps.push({
    label: "2. 退休後年缺口",
    formula: `退休後年支出 ${f0(retSpend)} − 保證年收入 ${f0(guaranteedAnnual)}（勞退 ${f0(a.laborPensionMonthly)}/月 + 勞保 ${f0(a.laborInsuranceMonthly)}/月 × 12）`,
    result: `${f0(gap)} 元/年`,
    note: `勞退自 ${a.laborPensionStartAge ?? 60} 歲、勞保自 ${a.laborInsuranceStartAge ?? 65} 歲起打底，只有不足的缺口才靠自己的資產；若在請領年齡前退休，那段期間要自己支應尚未開始的部分。`,
  });

  steps.push({
    label: "3. 退休目標金額",
    formula: `年缺口 ${f0(gap)} ÷ 提領率 ${fp(a.withdrawalRate)}（= × ${(1 / a.withdrawalRate).toFixed(1)} 倍）`,
    result: `${f0(result.target)} 元`,
    note: `4% 法則：存到年缺口的 ${(1 / a.withdrawalRate).toFixed(0)} 倍，每年提 ${fp(a.withdrawalRate)} 理論上可永久支應。`,
  });

  steps.push({
    label: "4. 實質投資報酬率",
    formula: `(1 + 名目 ${fp(a.nominalReturn)}) ÷ (1 + 通膨 ${fp(a.inflation)}) − 1`,
    result: fp(rInvest),
    note: "全程用「今日購買力」計算，所以把名目報酬扣掉通膨換成實質。現金桶用實質 " + fp(a.realCashReturn) + "。",
  });

  if (!a.useFixedDca) {
    steps.push({
      label: "5. 每年儲蓄（會逐年變）",
      formula: `年收入 − 工作期年支出 ${f0(baseSpending)}；收入每年 ×(1+實質加薪 ${fp(realRaise)})`,
      result: `首年約 ${f0(state.income.annualIncome - baseSpending)} 元`,
      note: "存下來的錢投入投資部位，隔年連本帶利再滾。",
    });
  } else {
    steps.push({
      label: "5. 每年投入（固定定期定額）",
      formula: `每月 ${f0(a.fixedMonthlyDca)} × 12`,
      result: `${f0(a.fixedMonthlyDca * 12)} 元/年`,
    });
  }

  steps.push({
    label: "6. 逐年累積，直到淨值 ≥ 目標",
    formula: `每年：投資 ×(1+${fp(rInvest)}) + 當年儲蓄；現金 ×(1+${fp(a.realCashReturn)})`,
    result:
      result.retirementAge !== null
        ? `${result.retirementAge} 歲達標（還要 ${result.yearsToRetire} 年）`
        : `期限內未達標，缺 ${f0(result.shortfall)} 元`,
    note:
      result.depletionAge !== null
        ? `退休後每年提領缺口，資產在 ${result.depletionAge} 歲耗盡——計畫需調整。`
        : "退休後每年提領缺口，資產可支撐到預期壽命。",
  });

  // Year-by-year rows reconstructing each year's cash flow.
  const years: BreakdownYear[] = result.series.map((p, i) => {
    let flow: number;
    if (p.phase === "accumulation") {
      const yearsElapsed = p.age - a.currentAge;
      flow = a.useFixedDca
        ? a.fixedMonthlyDca * 12
        : state.income.annualIncome * Math.pow(1 + realRaise, yearsElapsed) -
          baseSpending;
    } else {
      flow = -gap;
    }
    // Zero out flow once depleted (no more withdrawals possible).
    if (
      result.depletionAge !== null &&
      p.age > result.depletionAge &&
      i > 0
    ) {
      flow = 0;
    }
    return {
      age: p.age,
      startInvested: p.invested,
      startCash: p.cash,
      startNetWorth: p.netWorth,
      flow,
      phase: p.phase,
    };
  });

  return { steps, years };
}
