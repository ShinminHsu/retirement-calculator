import { describe, it, expect } from "vitest";
import { AppState, defaultState } from "../types";
import { runMonteCarlo, solveMaxSpending } from "./montecarlo";

function stateWith(patch: (s: AppState) => void): AppState {
  const s = defaultState();
  patch(s);
  return s;
}

describe("Monte Carlo", () => {
  it("returns a success rate in [0,1] and ordered percentiles", () => {
    const s = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.monteCarloRuns = 300;
    });
    const r = runMonteCarlo(s);
    expect(r.successRate).toBeGreaterThanOrEqual(0);
    expect(r.successRate).toBeLessThanOrEqual(1);
    expect(r.p10).toBeLessThanOrEqual(r.p50);
    expect(r.p50).toBeLessThanOrEqual(r.p90);
  });

  it("is deterministic across calls (seeded RNG)", () => {
    const s = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.monteCarloRuns = 200;
    });
    expect(runMonteCarlo(s).successRate).toBe(runMonteCarlo(s).successRate);
  });

  it("higher volatility does not raise the success rate of a healthy plan", () => {
    const lowVol = stateWith((x) => {
      x.income.annualIncome = 2_000_000;
      x.income.workingSpending = 600_000;
      x.assumptions.monteCarloRuns = 500;
      x.assumptions.returnVolatility = 0.05;
    });
    const highVol = { ...lowVol, assumptions: { ...lowVol.assumptions, returnVolatility: 0.3 } };
    expect(runMonteCarlo(highVol).successRate).toBeLessThanOrEqual(
      runMonteCarlo(lowVol).successRate + 0.02,
    );
  });
});

describe("max spending solver", () => {
  function richRetiree(): AppState {
    return stateWith((x) => {
      x.positions = [
        { id: "1", account: "a", ticker: "0050", shares: 300000, currency: "TWD" },
      ];
      x.quoteCache = {
        "0050": { price: 100, asOf: "2026-06-04", currency: "TWD", manual: true },
      };
      x.income.annualIncome = 0;
      x.income.workingSpending = 400_000;
      x.assumptions.currentAge = 60;
      x.assumptions.useFixedDca = true;
      x.assumptions.fixedMonthlyDca = 0;
      x.assumptions.monteCarloRuns = 300;
    });
  }

  it("found spending meets the target success rate", () => {
    const s = richRetiree();
    const sol = solveMaxSpending(s, 0.9);
    expect(sol.successAtMax).toBeGreaterThanOrEqual(0.9 - 0.05);
    expect(sol.maxSpending).toBeGreaterThan(0);
  });

  it("a stricter target yields less-or-equal spending", () => {
    const s = richRetiree();
    const strict = solveMaxSpending(s, 0.95).maxSpending;
    const loose = solveMaxSpending(s, 0.8).maxSpending;
    expect(strict).toBeLessThanOrEqual(loose + 1); // allow rounding noise
  });

  it("does not mutate saved state", () => {
    const s = richRetiree();
    const before = s.income.retirementSpendingOverride;
    solveMaxSpending(s, 0.9);
    expect(s.income.retirementSpendingOverride).toBe(before);
  });
});
