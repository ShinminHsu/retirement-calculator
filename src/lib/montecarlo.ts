import { AppState } from "../types";
import {
  annualGuaranteedIncome,
  buildSimContext,
  retirementSpending,
  simulatePath,
  toReal,
} from "./finance";

export interface MonteCarloResult {
  runs: number;
  successRate: number; // 0..1: reached target and survived to life expectancy
  p10: number;
  p50: number;
  p90: number;
}

// Mulberry32 — small seedable PRNG so the on-screen number is stable per inputs.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller: one standard normal from two uniforms.
function makeNormal(rng: () => number): () => number {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1))),
  );
  return sorted[idx];
}

// Run the accumulation→decumulation path many times, drawing each year's real
// return from Normal(mean, volatility). Success = target reached and not depleted.
export function runMonteCarlo(state: AppState, runsOverride?: number): MonteCarloResult {
  const a = state.assumptions;
  const ctx = buildSimContext(state);
  const mean = toReal(a.nominalReturn, a.inflation);
  const vol = Math.max(0, a.returnVolatility);
  const runs = Math.max(1, Math.floor(runsOverride ?? a.monteCarloRuns));

  const rng = mulberry32(0x9e3779b9);
  const normal = makeNormal(rng);

  let successes = 0;
  const endings: number[] = [];

  for (let i = 0; i < runs; i++) {
    const sim = simulatePath(ctx, () => mean + vol * normal(), false);
    const reached = sim.retirementAge !== null;
    const survived = sim.depletionAge === null;
    if (reached && survived) successes++;
    endings.push(sim.finalNet);
  }

  endings.sort((x, y) => x - y);
  return {
    runs,
    successRate: successes / runs,
    p10: percentile(endings, 10),
    p50: percentile(endings, 50),
    p90: percentile(endings, 90),
  };
}

export interface SpendingSolution {
  targetSuccess: number;
  maxSpending: number; // max retirement annual spending meeting the target
  successAtMax: number; // simulated success rate at that spending
  currentSpending: number; // user's current retirement spending, for comparison
}

// Inverse of runMonteCarlo: given a target success rate, binary-search the
// highest retirement annual spending whose success rate meets the target.
// Success decreases monotonically in spending, so bisection is reliable.
export function solveMaxSpending(
  state: AppState,
  targetSuccess: number,
): SpendingSolution {
  // Cap runs per evaluation for responsiveness (see design.md).
  const runs = Math.min(state.assumptions.monteCarloRuns, 600);
  const guaranteed = annualGuaranteedIncome(state.assumptions);
  const currentSpending = retirementSpending(state.income);

  const successAt = (spending: number): number => {
    const trial: AppState = {
      ...state,
      income: { ...state.income, retirementSpendingOverride: spending },
    };
    return runMonteCarlo(trial, runs).successRate;
  };

  // Lower bound: spend nothing beyond guaranteed income (gap 0) ⇒ ~100% success.
  let lo = guaranteed;
  // Upper bound: expand until success drops below target (bracket the root).
  let hi = Math.max(currentSpending * 1.5, guaranteed + 600_000);
  for (let i = 0; i < 12 && successAt(hi) >= targetSuccess; i++) hi *= 1.5;

  // Bisection: keep the highest spending still meeting the target.
  let best = lo;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (successAt(mid) >= targetSuccess) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return {
    targetSuccess,
    maxSpending: best,
    successAtMax: successAt(best),
    currentSpending,
  };
}
