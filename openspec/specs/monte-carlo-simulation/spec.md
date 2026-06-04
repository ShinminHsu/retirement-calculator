# monte-carlo-simulation Specification

## Purpose

TBD - created by archiving change 'projection-enhancements'. Update Purpose after archive.

## Requirements

### Requirement: Monte Carlo success rate

The system SHALL estimate the plan's success probability by running many simulations (default 1000) in which each year's investment return is drawn from a normal distribution centered on the real investment return with an adjustable volatility. A run SHALL count as a success when net worth reaches the retirement target and the portfolio is not exhausted before the life-expectancy age. The system SHALL report the success rate as a percentage.

#### Scenario: Reports a success rate between 0 and 100

- **WHEN** the user runs the Monte Carlo simulation
- **THEN** the system reports a success rate in the inclusive range 0%–100%

#### Scenario: Higher volatility lowers success rate, all else equal

- **WHEN** the same plan is simulated with a higher return volatility
- **THEN** the reported success rate is not higher than with the lower volatility (within sampling noise the expectation decreases)

---
### Requirement: Ending-balance distribution

The system SHALL report the distribution of ending net worth across runs as the 10th, 50th, and 90th percentiles, in today's purchasing power.

#### Scenario: Percentiles are ordered

- **WHEN** the simulation completes
- **THEN** the reported p10 ≤ p50 ≤ p90

---
### Requirement: Deterministic mode unaffected

The system SHALL keep the existing single-rate deterministic projection available and unchanged; the Monte Carlo result SHALL be presented as an additional, separate estimate.

#### Scenario: Deterministic result is still shown

- **WHEN** the Monte Carlo panel is displayed
- **THEN** the deterministic retirement age, target, and curve remain shown and unchanged
