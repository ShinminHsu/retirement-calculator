# income-and-budget Specification

## Purpose

TBD - created by archiving change 'retirement-calculator-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Annual income and raise rate

The system SHALL accept the user's current annual income and a nominal annual raise rate. The system SHALL project income forward year by year by compounding the raise rate until the retirement year.

#### Scenario: Income grows with raises

- **WHEN** current annual income is 1,000,000 TWD and the nominal raise rate is 3%
- **THEN** projected income in the next year is 1,030,000 TWD
- **AND** the year after is 1,060,900 TWD

---
### Requirement: Annual spending budget

The system SHALL accept a working-life annual spending budget, entered either as a single total or as optional named categories that sum to the total. When categories are used, the system SHALL display their sum as the working-life annual spending.

#### Scenario: Total-only budget

- **WHEN** the user enters a working-life annual budget of 600,000 TWD without categories
- **THEN** working-life annual spending is 600,000 TWD

#### Scenario: Categorized budget sums to total

- **WHEN** the user enters categories 居住 240000, 飲食 180000, 旅遊 120000, 其他 60000
- **THEN** working-life annual spending is 600,000 TWD

---
### Requirement: Separate retirement spending

The system SHALL maintain a retirement-era annual spending value distinct from working-life spending. The retirement value SHALL default to equal the working-life total and SHALL be independently adjustable.

#### Scenario: Default equals working-life

- **WHEN** the user has not set a retirement spending value and working-life spending is 600,000 TWD
- **THEN** retirement annual spending is 600,000 TWD

#### Scenario: Independent override

- **WHEN** the user sets retirement annual spending to 480,000 TWD
- **THEN** retirement annual spending is 480,000 TWD and working-life spending is unchanged

---
### Requirement: Annual savings derivation

The system SHALL derive each working year's savings as annual income minus working-life annual spending for that year. When derived savings are negative, the system SHALL treat that year's contribution as negative (drawing down assets) and surface a warning.

#### Scenario: Positive savings

- **WHEN** projected income for a year is 1,030,000 TWD and spending is 600,000 TWD
- **THEN** that year's savings contribution is 430,000 TWD

#### Scenario: Spending exceeds income

- **WHEN** projected income is 500,000 TWD and spending is 600,000 TWD
- **THEN** that year's contribution is −100,000 TWD
- **AND** the system surfaces a negative-savings warning

---
### Requirement: Nominal-to-real normalization

The system SHALL operate the projection in today's purchasing power. It SHALL accept an inflation assumption and convert nominal raise rates and nominal investment returns into real terms for projection, so that all displayed amounts are in today's TWD.

#### Scenario: Real raise from nominal

- **WHEN** the nominal raise rate is 5% and inflation is 3%
- **THEN** the real raise rate used in projection is approximately 1.94% (`(1.05/1.03) − 1`)
