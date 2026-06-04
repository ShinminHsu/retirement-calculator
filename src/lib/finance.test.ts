import { describe, it, expect } from "vitest";
import { AppState, defaultState } from "../types";
import {
  retirementTarget,
  retirementSpending,
  workingSpending,
  toReal,
  project,
  summarizePortfolio,
  buildBreakdown,
  coastFire,
} from "./finance";
import { newId } from "../types";

function stateWith(patch: (s: AppState) => void): AppState {
  const s = defaultState();
  patch(s);
  return s;
}

describe("retirement target (floor-and-upside)", () => {
  it("gap-based target with guaranteed income", () => {
    const s = stateWith((x) => {
      x.income.workingSpending = 600_000;
      x.income.retirementSpendingOverride = null;
      x.assumptions.guaranteedMonthlyIncome = 25_000;
      x.assumptions.withdrawalRate = 0.04;
    });
    // gap = 600k - 300k = 300k; target = 300k / 0.04 = 7.5M
    expect(retirementTarget(s)).toBe(7_500_000);
  });

  it("no guaranteed income -> 25x spending", () => {
    const s = stateWith((x) => {
      x.income.workingSpending = 600_000;
      x.assumptions.guaranteedMonthlyIncome = 0;
      x.assumptions.withdrawalRate = 0.04;
    });
    expect(retirementTarget(s)).toBe(15_000_000);
  });

  it("guaranteed income fully covers spending -> target 0", () => {
    const s = stateWith((x) => {
      x.income.workingSpending = 600_000;
      x.assumptions.guaranteedMonthlyIncome = 60_000;
    });
    expect(retirementTarget(s)).toBe(0);
  });
});

describe("income & budget", () => {
  it("retirement spending defaults to working-life total", () => {
    const s = stateWith((x) => {
      x.income.workingSpending = 600_000;
      x.income.retirementSpendingOverride = null;
    });
    expect(retirementSpending(s.income)).toBe(600_000);
  });

  it("categorized budget sums to total", () => {
    const s = stateWith((x) => {
      x.income.useCategories = true;
      x.income.spendingCategories = [
        { id: "1", label: "居住", amount: 240_000 },
        { id: "2", label: "飲食", amount: 180_000 },
        { id: "3", label: "旅遊", amount: 120_000 },
        { id: "4", label: "其他", amount: 60_000 },
      ];
    });
    expect(workingSpending(s.income)).toBe(600_000);
  });
});

describe("nominal to real", () => {
  it("real raise from nominal", () => {
    expect(toReal(0.05, 0.03)).toBeCloseTo(0.0194, 4);
  });
});

describe("two-bucket projection", () => {
  it("cash bucket does not compound at the investment rate", () => {
    const s = stateWith((x) => {
      x.cashAccounts = [{ id: "c", label: "活存", amountTwd: 800_000 }];
      x.assumptions.realCashReturn = 0;
      x.assumptions.nominalReturn = 0.07;
      x.assumptions.inflation = 0.03;
      x.assumptions.useFixedDca = true;
      x.assumptions.fixedMonthlyDca = 0;
      x.income.workingSpending = 0;
      x.income.annualIncome = 0;
    });
    const r = project(s);
    // After one year cash stays flat in real terms.
    const yr1 = r.series.find((p) => p.age === s.assumptions.currentAge + 1)!;
    expect(yr1.cash).toBeCloseTo(800_000, 0);
  });
});

describe("feasibility & depletion", () => {
  it("reports a retirement age when target is reachable", () => {
    const s = stateWith((x) => {
      x.cashAccounts = [];
      x.positions = [];
      x.quoteCache = {};
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.currentAge = 30;
      x.assumptions.withdrawalRate = 0.04;
      x.assumptions.guaranteedMonthlyIncome = 0;
      x.assumptions.useFixedDca = false;
    });
    const r = project(s);
    expect(r.retirementAge).not.toBeNull();
    expect(r.yearsToRetire).toBe(r.retirementAge! - 30);
  });

  it("marks depletion when withdrawals exhaust the portfolio early", () => {
    // Tiny portfolio, huge gap, zero growth -> depletes fast after retiring.
    const s = stateWith((x) => {
      x.positions = [];
      x.cashAccounts = [{ id: "c", label: "現金", amountTwd: 100_000 }];
      x.income.annualIncome = 0;
      x.income.workingSpending = 0;
      x.income.retirementSpendingOverride = 500_000;
      x.assumptions.currentAge = 64;
      x.assumptions.lifeExpectancyAge = 95;
      x.assumptions.guaranteedMonthlyIncome = 0;
      x.assumptions.withdrawalRate = 0.04;
      x.assumptions.nominalReturn = 0.03;
      x.assumptions.inflation = 0.03; // real return 0
      x.assumptions.realCashReturn = 0;
      x.assumptions.useFixedDca = true;
      x.assumptions.fixedMonthlyDca = 0;
    });
    const r = project(s);
    // target = 500k/0.04 = 12.5M, never reached -> not retired, no depletion
    expect(r.retirementAge).toBeNull();
    expect(r.shortfall).toBeGreaterThan(0);
  });
});

describe("calculation breakdown", () => {
  it("produces steps and one year row per projected year", () => {
    const s = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.currentAge = 30;
      x.assumptions.lifeExpectancyAge = 95;
    });
    const b = buildBreakdown(s);
    expect(b.steps.length).toBeGreaterThanOrEqual(6);
    // One row per year from currentAge..lifeExpectancyAge inclusive.
    expect(b.years[0].age).toBe(30);
    expect(b.years[b.years.length - 1].age).toBe(95);
    // Accumulation years have positive savings flow here.
    expect(b.years[0].flow).toBeGreaterThan(0);
    // The target step result is non-empty.
    expect(b.steps.find((st) => st.label.includes("退休目標"))).toBeTruthy();
  });

  it("shows withdrawals (negative flow) after retirement", () => {
    const s = stateWith((x) => {
      x.income.annualIncome = 3_000_000;
      x.income.workingSpending = 500_000;
      x.assumptions.currentAge = 30;
      x.assumptions.guaranteedMonthlyIncome = 0;
    });
    const b = buildBreakdown(s);
    const decum = b.years.filter((y) => y.phase === "decumulation");
    expect(decum.length).toBeGreaterThan(0);
    expect(decum[0].flow).toBeLessThanOrEqual(0);
  });
});

describe("Coast FIRE", () => {
  it("discounts the target back to today at the real return", () => {
    const s = stateWith((x) => {
      x.income.workingSpending = 400_000; // target = 10M at 4%
      x.assumptions.withdrawalRate = 0.04;
      x.assumptions.guaranteedMonthlyIncome = 0;
      x.assumptions.nominalReturn = 0.04;
      x.assumptions.inflation = 0; // real return 4%
      x.assumptions.currentAge = 30;
      x.assumptions.coastAge = 65;
    });
    const c = coastFire(s);
    const expected = 10_000_000 / Math.pow(1.04, 35);
    expect(c.coastNumber).toBeCloseTo(expected, 0);
  });

  it("flags reached when investments exceed the coast number", () => {
    const s = stateWith((x) => {
      x.positions = [
        { id: "1", account: "a", ticker: "0050", shares: 100000, currency: "TWD" },
      ];
      x.quoteCache = { "0050": { price: 100, asOf: "2026-06-04", currency: "TWD", manual: true } };
      x.income.workingSpending = 400_000;
      x.assumptions.withdrawalRate = 0.04;
      x.assumptions.nominalReturn = 0.04;
      x.assumptions.inflation = 0;
    });
    const c = coastFire(s);
    // invested = 10M, well above coastNumber (~2.5M) -> reached
    expect(c.reached).toBe(true);
    expect(c.shortfall).toBe(0);
  });
});

describe("cashflow events in projection", () => {
  it("no events => identical to projection without events", () => {
    const base = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
    });
    const a = project(base);
    const withEmpty = project({ ...base, cashflowEvents: [] });
    expect(withEmpty.retirementAge).toBe(a.retirementAge);
    expect(withEmpty.series.length).toBe(a.series.length);
  });

  it("a large outflow delays retirement", () => {
    const base = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.currentAge = 30;
    });
    const before = project(base).retirementAge!;
    const withOutflow = project({
      ...base,
      cashflowEvents: [
        { id: newId(), label: "買房頭期", age: 35, amount: -3_000_000 },
      ],
    }).retirementAge!;
    expect(withOutflow).toBeGreaterThanOrEqual(before);
  });

  it("outflow draws from investments then cash", () => {
    const s = stateWith((x) => {
      x.positions = [
        { id: "1", account: "a", ticker: "0050", shares: 15000, currency: "TWD" },
      ];
      x.quoteCache = { "0050": { price: 100, asOf: "2026-06-04", currency: "TWD", manual: true } };
      x.cashAccounts = [{ id: "c", label: "現金", amountTwd: 1_000_000 }];
      x.income.annualIncome = 0;
      x.income.workingSpending = 0;
      x.assumptions.useFixedDca = true;
      x.assumptions.fixedMonthlyDca = 0;
      x.assumptions.nominalReturn = 0;
      x.assumptions.inflation = 0;
      x.assumptions.realCashReturn = 0;
      x.assumptions.currentAge = 40;
      x.cashflowEvents = [
        { id: "e", label: "買房", age: 41, amount: -2_000_000 },
      ];
    });
    // invested 1.5M, cash 1M; at 41 outflow 2M -> invest 0, cash 0.5M
    const r = project(s);
    const at42 = r.series.find((p) => p.age === 42)!;
    expect(at42.invested).toBeCloseTo(0, 0);
    expect(at42.cash).toBeCloseTo(500_000, 0);
  });
});

describe("portfolio aggregation", () => {
  it("sums positions and cash into net worth, dedupes by ticker", () => {
    const s = stateWith((x) => {
      x.positions = [
        { id: "1", account: "玉山", ticker: "0050", shares: 200, currency: "TWD" },
        { id: "2", account: "元大", ticker: "0050", shares: 150, currency: "TWD" },
      ];
      x.cashAccounts = [{ id: "c", label: "活存", amountTwd: 800_000 }];
      x.quoteCache = {
        "0050": { price: 100, asOf: "2026-06-04", currency: "TWD", manual: true },
      };
    });
    const sum = summarizePortfolio(s);
    expect(sum.investedTwd).toBe(35_000); // 350 shares * 100
    expect(sum.cashTwd).toBe(800_000);
    expect(sum.netWorthTwd).toBe(835_000);
    expect(sum.byTicker).toHaveLength(1);
    expect(sum.byTicker[0].totalShares).toBe(350);
  });
});
