import { describe, it, expect } from "vitest";
import { AppState, defaultState } from "../types";
import { runMonteCarlo } from "./montecarlo";

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
