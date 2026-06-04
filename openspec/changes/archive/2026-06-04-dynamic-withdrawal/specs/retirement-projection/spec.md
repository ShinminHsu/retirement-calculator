## ADDED Requirements

### Requirement: Withdrawal strategy selection

The system SHALL offer a withdrawal strategy of either fixed real amount (the existing behavior) or dynamic guardrails. The selection SHALL default to fixed so existing results are unchanged.

#### Scenario: Default is fixed

- **WHEN** the user has not chosen a strategy
- **THEN** the projection withdraws the fixed real gap each retirement year, identical to the prior behavior

### Requirement: Guardrail dynamic withdrawal

Under the guardrails strategy, the system SHALL adjust each retirement year's spending based on the current implied withdrawal rate versus the planned rate: when current spending divided by the current portfolio exceeds the planned rate times (1 + band), spending is cut by the adjustment fraction; when it falls below the planned rate times (1 − band), spending is raised by the adjustment fraction. Band and adjustment fraction SHALL be adjustable.

#### Scenario: Cuts spending after a market drop

- **WHEN** the portfolio falls enough that the implied withdrawal rate exceeds the upper guardrail
- **THEN** that year's spending is reduced by the adjustment fraction

#### Scenario: Raises spending after strong markets

- **WHEN** the portfolio grows enough that the implied withdrawal rate falls below the lower guardrail
- **THEN** that year's spending is increased by the adjustment fraction

#### Scenario: Improves Monte Carlo success versus fixed

- **WHEN** the same plan is simulated with guardrails instead of fixed withdrawal
- **THEN** the reported success rate is greater than or equal to the fixed-strategy success rate
