## 1. Solver

- [x] 1.1 Implement Maximum sustainable spending solver as `solveMaxSpending` per the Binary search over retirement spending design, reusing runMonteCarlo and not mutating state, with the Simulation budget for responsiveness cap

## 2. UI

- [x] 2.1 Add a Solver result presentation panel: target success input, "計算" button, max spending, and comparison vs current retirement spending
- [x] 2.2 Add a tutorial section explaining the reverse "max spending" usage

## 3. Verification

- [x] 3.1 Unit tests: solved spending meets target, higher target ≤ lower target spending, state not mutated
- [x] 3.2 Typecheck, run full suite, build
