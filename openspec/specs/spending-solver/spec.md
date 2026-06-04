# spending-solver Specification

## Purpose

TBD - created by archiving change 'spending-solver'. Update Purpose after archive.

## Requirements

### Requirement: Maximum sustainable spending solver

The system SHALL compute, for a user-specified target success rate, the maximum retirement annual spending whose Monte Carlo success rate meets or exceeds that target. The search SHALL use the current assumptions (return, volatility, withdrawal strategy, guaranteed income) and SHALL NOT modify the saved state.

#### Scenario: Returns a spending level meeting the target

- **WHEN** the user requests the max spending for a 90% target success rate
- **THEN** the system returns an annual spending amount whose simulated success rate is at least approximately 90%
- **AND** spending a meaningfully higher amount would drop the success rate below the target

#### Scenario: Monotonic — higher target yields lower or equal spending

- **WHEN** the solver is run for a 95% target and again for an 80% target, all else equal
- **THEN** the 95% target's max spending is less than or equal to the 80% target's

#### Scenario: Does not mutate saved state

- **WHEN** the solver runs
- **THEN** the user's stored retirement spending and other inputs are unchanged afterward


<!-- @trace
source: spending-solver
updated: 2026-06-04
code:
  - src/App.tsx
  - tsconfig.tsbuildinfo
  - src/components/SpendingSolverPanel.tsx
  - src/lib/montecarlo.ts
  - src/components/TutorialTab.tsx
tests:
  - src/lib/montecarlo.test.ts
-->

---
### Requirement: Solver result presentation

The system SHALL present the solved max annual spending and compare it to the user's current retirement annual spending (how much more or less per year).

#### Scenario: Comparison shown

- **WHEN** the solved max spending is 780,000 and the current retirement spending is 600,000
- **THEN** the system shows the max and that it is 180,000/year higher than the current setting

<!-- @trace
source: spending-solver
updated: 2026-06-04
code:
  - src/App.tsx
  - tsconfig.tsbuildinfo
  - src/components/SpendingSolverPanel.tsx
  - src/lib/montecarlo.ts
  - src/components/TutorialTab.tsx
tests:
  - src/lib/montecarlo.test.ts
-->