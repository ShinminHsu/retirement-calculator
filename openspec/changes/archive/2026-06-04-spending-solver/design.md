## Context

Inverse of the existing Monte Carlo: instead of spending → success rate, solve success rate → max spending. Success rate is monotonically decreasing in retirement spending (more spending raises both the target and the withdrawal), so a binary search is exact enough and cheap.

## Goals / Non-Goals

**Goals:**

- A pure function `solveMaxSpending(state, targetSuccess)` reusing `runMonteCarlo`.
- Reflect current assumptions including the guardrail strategy.
- Never mutate saved state.

**Non-Goals:**

- No solving for retirement age or savings rate in this change (spending only).
- No analytic/closed-form solution; numeric search is sufficient.

## Decisions

### Binary search over retirement spending

Lower bound = annual guaranteed income (gap 0 ⇒ ~100% success). Upper bound starts above current spending and expands (×1.5) until its success drops below target, guaranteeing a bracket. Then ~24 bisection steps converge to the spending where success ≈ target; return the highest spending still meeting the target. Each evaluation clones the state with `retirementSpendingOverride = candidate` and runs `runMonteCarlo` (seeded RNG keeps it stable). Alternative considered: scan a fixed grid — rejected as less precise per simulation budget.

### Simulation budget for responsiveness

The solver runs Monte Carlo ~24 times. To stay responsive it caps runs per evaluation at min(configured runs, 600); the final reported success uses this same budget. Trade-off: a little sampling noise for sub-second response, acceptable for a planning estimate.

## Risks / Trade-offs

- [Many simulations make the UI janky] → Cap per-eval runs and defer with a "計算中" state; it is triggered by a button, not reactive.
- [Sampling noise near the boundary] → Seeded RNG makes results repeatable; present rounded to a sensible unit (萬).

## Open Questions

- None blocking.
