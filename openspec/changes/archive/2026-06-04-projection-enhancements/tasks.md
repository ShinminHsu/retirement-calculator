## 1. Data model

- [x] 1.1 Add `cashflowEvents` and Coast/Monte-Carlo assumptions (coastAge, returnVolatility, monteCarloRuns) to types and defaults, with localStorage merge keeping old backups loadable

## 2. Cashflow events

- [x] 2.1 Implement One-off cashflow events data ops: add/edit/delete events (label, age, signed amount)
- [x] 2.2 Implement Events applied in the projection per the Cashflow events threaded into the projection loop design: inflow to investments, outflow from investments then cash, summed per age
- [x] 2.3 Add a Cashflow events panel UI (list + add/edit/delete)

## 3. Retirement projection updates

- [x] 3.1 Implement Cashflow events in projection with backward compatibility (no events ⇒ identical output)
- [x] 3.2 Implement Coast FIRE metric per the Coast FIRE as discounting the target to today design: coast number, reached/shortfall, age current assets alone reach target
- [x] 3.3 Surface Coast FIRE in the result summary / breakdown

## 4. Monte Carlo simulation

- [x] 4.1 Implement Monte Carlo success rate in `src/lib/montecarlo.ts` per the Monte Carlo over annual normal return draws design, reusing the shared per-year step from Reusing the deterministic engine shape
- [x] 4.2 Implement Ending-balance distribution (p10/p50/p90) and keep Deterministic mode unaffected
- [x] 4.3 Add a Monte Carlo panel UI: success rate, percentiles, adjustable volatility, run button

## 5. Verification

- [x] 5.1 Unit tests: Coast FIRE discounting, event inflow/outflow cascade, no-events backward compatibility, Monte Carlo success-rate bounds and percentile ordering
- [x] 5.2 Typecheck, run full suite, manually verify panels render and recompute
