## 1. Data model

- [x] 1.1 Add `withdrawalStrategy`, `guardrailBand`, `guardrailAdjust` to assumptions and defaults (default fixed), with localStorage merge keeping old backups loadable

## 2. Engine

- [x] 2.1 Implement Withdrawal strategy selection in SimContext/simulatePath per the Threaded through SimContext, defaulting to fixed design
- [x] 2.2 Implement Guardrail dynamic withdrawal per the Guardrails on the implied withdrawal rate design: adjust yearly spending on band breach, withdraw investments then cash

## 3. UI

- [x] 3.1 Add a withdrawal-strategy selector + band/adjust inputs to the assumptions panel, with the bad-years trade-off note
- [x] 3.2 Add a tutorial section explaining dynamic withdrawal (guardrails)

## 4. Verification

- [x] 4.1 Unit tests: fixed default unchanged, guardrails cut after drop / raise after growth, Monte Carlo success guardrails ≥ fixed
- [x] 4.2 Typecheck, run full suite, build
