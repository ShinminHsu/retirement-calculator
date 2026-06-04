## Context

Adds a withdrawal strategy to the decumulation phase shared by `simulatePath` (used by both the deterministic projection and Monte Carlo). Must default to fixed so all existing tests stay green, and must remain a pure local frontend.

## Goals / Non-Goals

**Goals:**

- Guyton-Klinger-style guardrails applied per retirement year inside the shared simulation step.
- Monte Carlo automatically benefits (higher, more realistic success rate).
- Backward compatible: fixed strategy reproduces current behavior exactly.

**Non-Goals:**

- No full Guyton-Klinger rule set (no inflation-freeze rule, no portfolio-management rule); a single guardrail band on the withdrawal rate only.
- No separate "spending success" metric in MVP; success stays "reached target and not depleted", with a UI note that guardrails trade depletion risk for lower spending in bad years.

## Decisions

### Guardrails on the implied withdrawal rate

Track a current real spending level `S`, initialized to the planned gap when retirement begins. Each retirement year, after growth: if `S / portfolio > plannedRate × (1 + band)` then `S *= (1 − adjust)`; else if `S / portfolio < plannedRate × (1 − band)` then `S *= (1 + adjust)`. Then withdraw `S` (investments first, then cash). `plannedRate` is the configured withdrawal rate; defaults band 0.2, adjust 0.1. Alternative considered: withdraw a flat percentage of the current balance each year (constant-percentage) — rejected because income swings wildly; guardrails dampen that while still adapting.

### Threaded through SimContext, defaulting to fixed

Add `withdrawalStrategy`, `guardrailBand`, `guardrailAdjust`, and `plannedRate` to `SimContext`. `simulatePath` uses `S = gap` constant for the fixed strategy (current code path) and the guardrail update for the dynamic one. Empty/legacy state defaults to fixed via the localStorage merge, so prior results and tests are unchanged.

## Risks / Trade-offs

- [Guardrails hide real lifestyle pain by cutting spending] → UI/tutorial note that higher success comes from spending less in bad years; future work could report the spending path.
- [Behavior drift in deterministic mode] → With steady returns the guardrail rarely triggers, so the deterministic curve stays close to fixed; covered by a fixed-default backward-compat test.

## Open Questions

- None blocking.
