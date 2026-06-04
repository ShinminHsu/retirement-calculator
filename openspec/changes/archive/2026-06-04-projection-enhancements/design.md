## Context

Builds on the archived MVP (see `openspec/specs/retirement-projection`). Adds Coast FIRE, one-off cashflow events, and a Monte Carlo success rate. All amounts stay in today's purchasing power. Must remain a pure local frontend with no new dependencies, and must not change deterministic results when the new inputs are empty/unused (existing tests stay green).

## Goals / Non-Goals

**Goals:**

- Coast FIRE as a pure derived metric from the existing target and real return.
- Cashflow events threaded into the single projection loop, applied per matching age, with backward compatibility.
- Monte Carlo over annual return draws, reporting success rate and ending-balance percentiles, without disturbing the deterministic path.

**Non-Goals:**

- No fat-tailed / regime-switching return models (normal draws only in MVP).
- No per-asset or correlated return modeling.
- No randomization of inflation, raises, spending, or event timing in MVP.
- No web worker; run synchronously (1000 runs is cheap).

## Decisions

### Coast FIRE as discounting the target to today

`coastNumber = target / (1 + rReal)^(coastAge − currentAge)`. Reached when `investedTwd ≥ coastNumber`. Also report the age at which current investments alone (no contributions) reach the target: solve `invested·(1+rReal)^n ≥ target`. Coast age is a new assumption (default 65), distinct from the computed earliest-retirement age. Alternative considered: reuse the computed retirement age — rejected because Coast FIRE is specifically about a traditional/target age with zero further saving.

### Cashflow events threaded into the projection loop

Add `cashflowEvents: { id, label, age, amount }[]` to state (amount signed, today's TWD). In `project()`, after each year's growth and savings/withdrawal, apply events whose age equals the current age: add positive amounts to the investment bucket; subtract negative amounts from investments first, then cash. Events are summed per age. Empty list ⇒ identical output (guarded by a backward-compat test). This keeps a single source of truth for the curve, breakdown, and Monte Carlo.

### Monte Carlo over annual normal return draws

New `src/lib/montecarlo.ts`. Each run replays the same accumulation→decumulation logic but draws each year's real return from `Normal(rReal, volatility)` via Box–Muller; savings, events, gap, and target are unchanged. Success = target reached and portfolio not depleted before life-expectancy age. Report success rate and p10/p50/p90 of ending net worth. Default 1000 runs, adjustable volatility (default 0.15). Runs synchronously. Alternative considered: bootstrap historical TW/US returns — rejected for MVP (no bundled dataset, no new dependency).

### Reusing the deterministic engine shape

Factor the per-year step so deterministic `project()` and Monte Carlo share the same recurrence (growth, savings, events, withdrawal, depletion). The only difference is the return source (fixed vs sampled). This avoids drift between the two models.

## Risks / Trade-offs

- [Monte Carlo randomness yields slightly different numbers each run] → Use a fixed run count and present as a rounded percentage; note it is an estimate. Optionally seed the RNG for stable display.
- [Normal draws understate tail risk] → Document as a simplification; volatility is adjustable so users can stress it.
- [Event applied in wrong phase double-counts] → Single application point per age in the shared step; covered by tests.
- [Schema change breaks old backups] → Merge over defaults on load; `cashflowEvents` defaults to empty, new assumptions get defaults.

## Open Questions

- Whether to seed the Monte Carlo RNG for a stable on-screen number (leaning yes for UX).
