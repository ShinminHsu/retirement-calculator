import { describe, it, expect } from "vitest";
import { AppState, defaultState } from "../types";
import { project } from "./finance";
import { runMonteCarlo } from "./montecarlo";

function stateWith(patch: (s: AppState) => void): AppState {
  const s = defaultState();
  patch(s);
  return s;
}

// A retired-from-the-start setup: large portfolio already at/above target.
function retiredState(patch: (s: AppState) => void): AppState {
  return stateWith((x) => {
    x.positions = [
      { id: "1", account: "a", ticker: "0050", shares: 200000, currency: "TWD" },
    ];
    x.quoteCache = {
      "0050": { price: 100, asOf: "2026-06-04", currency: "TWD", manual: true },
    };
    x.cashAccounts = [];
    x.income.annualIncome = 0;
    x.income.workingSpending = 0;
    x.income.retirementSpendingOverride = 800_000;
    x.assumptions.guaranteedMonthlyIncome = 0;
    x.assumptions.withdrawalRate = 0.04;
    x.assumptions.currentAge = 60;
    x.assumptions.lifeExpectancyAge = 95;
    x.assumptions.useFixedDca = true;
    x.assumptions.fixedMonthlyDca = 0;
    patch(x);
  });
}

describe("guardrail withdrawal", () => {
  it("fixed strategy is unchanged from default behavior", () => {
    const base = retiredState((x) => {
      x.assumptions.withdrawalStrategy = "fixed";
    });
    const r = project(base);
    // 20M portfolio, target = 800k/0.04 = 20M -> retires immediately at 60.
    expect(r.retirementAge).toBe(60);
  });

  it("guardrails preserve assets better in a poor deterministic return", () => {
    // Real return below the withdrawal rate -> fixed depletes, guardrails cut spending.
    const fixed = retiredState((x) => {
      x.assumptions.withdrawalStrategy = "fixed";
      x.assumptions.nominalReturn = 0.02;
      x.assumptions.inflation = 0.02; // real return 0
    });
    const guard = retiredState((x) => {
      x.assumptions.withdrawalStrategy = "guardrails";
      x.assumptions.nominalReturn = 0.02;
      x.assumptions.inflation = 0.02;
    });
    const lastNet = (s: AppState) => {
      const series = project(s).series;
      return series[series.length - 1].netWorth;
    };
    const fixedEnd = lastNet(fixed);
    const guardEnd = lastNet(guard);
    expect(guardEnd).toBeGreaterThan(fixedEnd);
  });

  it("guardrails Monte Carlo success >= fixed success", () => {
    const fixed = retiredState((x) => {
      x.assumptions.withdrawalStrategy = "fixed";
      x.assumptions.monteCarloRuns = 400;
      x.assumptions.returnVolatility = 0.18;
    });
    const guard = retiredState((x) => {
      x.assumptions.withdrawalStrategy = "guardrails";
      x.assumptions.monteCarloRuns = 400;
      x.assumptions.returnVolatility = 0.18;
    });
    expect(runMonteCarlo(guard).successRate).toBeGreaterThanOrEqual(
      runMonteCarlo(fixed).successRate,
    );
  });
});
