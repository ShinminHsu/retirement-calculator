import { AppState } from "../types";
import { buildSimContext, simulatePath, toReal } from "./finance";

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
export function runMonteCarlo(state: AppState): MonteCarloResult {
  const a = state.assumptions;
  const ctx = buildSimContext(state);
  const mean = toReal(a.nominalReturn, a.inflation);
  const vol = Math.max(0, a.returnVolatility);
  const runs = Math.max(1, Math.floor(a.monteCarloRuns));

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
