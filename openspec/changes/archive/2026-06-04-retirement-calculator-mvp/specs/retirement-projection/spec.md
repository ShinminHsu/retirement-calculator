## ADDED Requirements

### Requirement: Retirement target via floor-and-upside

The system SHALL compute the self-funded retirement target as the annualized spending gap divided by an adjustable safe withdrawal rate, where the gap is retirement annual spending minus annualized guaranteed retirement income. Guaranteed monthly income (labor insurance + labor pension, manually entered) SHALL default to 0.

#### Scenario: Gap-based target

- **WHEN** retirement annual spending is 600,000 TWD, guaranteed monthly income is 25,000 TWD, and the withdrawal rate is 4%
- **THEN** the annualized gap is 600,000 − 300,000 = 300,000 TWD
- **AND** the retirement target is 300,000 ÷ 0.04 = 7,500,000 TWD

#### Scenario: No guaranteed income

- **WHEN** guaranteed monthly income is 0 and retirement annual spending is 600,000 TWD at a 4% rate
- **THEN** the retirement target is 15,000,000 TWD

#### Scenario: Withdrawal rate is adjustable

- **WHEN** the user changes the withdrawal rate from 4% to 3.5% with all else equal
- **THEN** the retirement target recomputes using the new rate

### Requirement: Two-bucket starting assets

The system SHALL split starting assets into an investment bucket and a cash bucket, projecting the investment bucket at the real investment return and the cash bucket at a separate, adjustable real cash return defaulting to 0%. New annual savings SHALL be added to the investment bucket by default.

#### Scenario: Cash does not compound at the investment rate

- **WHEN** starting cash is 800,000 TWD with a 0% real cash return and the investment bucket grows at 4% real
- **THEN** after one year the cash bucket is still 800,000 TWD in today's purchasing power
- **AND** the investment bucket has grown at 4%

### Requirement: Accumulation projection

The system SHALL project net worth year by year during the accumulation phase by growing the investment bucket at the real investment return, holding/growing the cash bucket at the cash return, and adding each year's derived savings to the investment bucket. The system SHALL support a simplified fixed monthly contribution (DCA) as an alternative to income-minus-spending savings.

#### Scenario: Year-by-year accumulation

- **WHEN** the investment bucket is 1,000,000 TWD, real return is 4%, and this year's savings are 430,000 TWD
- **THEN** the end-of-year investment bucket is 1,000,000 × 1.04 + 430,000 = 1,470,000 TWD (annual-compounding form)

#### Scenario: Fixed DCA alternative

- **WHEN** the user selects fixed monthly contribution mode at 30,000 TWD/month
- **THEN** the projection uses 30,000 TWD monthly contributions instead of income-minus-spending savings

### Requirement: Retirement feasibility and timeline

The system SHALL determine the earliest projected age at which net worth reaches the retirement target, reporting both the age and the number of years from now. If the target is not reached by a configured horizon, the system SHALL report the shortfall.

#### Scenario: Target reached

- **WHEN** projected net worth first reaches or exceeds the retirement target at age 52
- **THEN** the system reports retirement age 52 and the corresponding years-from-now

#### Scenario: Target not reached within horizon

- **WHEN** projected net worth never reaches the target before the horizon age
- **THEN** the system reports that the target is not reached and shows the remaining shortfall amount

### Requirement: Projection curve

The system SHALL produce a year-by-year series of net worth spanning the accumulation phase through a post-retirement decumulation phase, where post-retirement years draw the real gap from the portfolio. The series SHALL extend to a configurable life-expectancy age defaulting to 95, SHALL be floored at 0 (never negative), and SHALL be suitable for charting.

#### Scenario: Series crosses from accumulation to decumulation

- **WHEN** the projection is computed
- **THEN** the resulting series rises during accumulation and reflects withdrawals after the retirement age, extending to the life-expectancy age

#### Scenario: Portfolio depletes before life-expectancy age

- **WHEN** post-retirement withdrawals exhaust the portfolio at age 70 while the life-expectancy age is 95
- **THEN** the series value is 0 from age 70 onward (never negative)
- **AND** the system marks age 70 as the depletion year and surfaces a warning that assets run out before the life-expectancy age

#### Scenario: Portfolio sustains to life-expectancy age

- **WHEN** withdrawals never exhaust the portfolio before age 95
- **THEN** no depletion warning is shown and the series remains positive through age 95

### Requirement: Interactive what-if

The system SHALL recompute the target, retirement age, and projection curve in response to changes in the withdrawal rate, spending budget, and raise rate, and SHALL display how the projected retirement age shifts relative to the prior value.

#### Scenario: Raising the budget delays retirement

- **WHEN** the user increases the working-life annual budget such that yearly savings drop
- **THEN** the projected retirement age moves later
- **AND** the system shows the change in years versus the previous setting
