## ADDED Requirements

### Requirement: Coast FIRE metric

The system SHALL compute a Coast FIRE number: the investment amount that, with no further contributions, would grow at the real investment return to reach the retirement target by an adjustable coast age (default 65). The system SHALL report the Coast FIRE number, whether current investments already meet it, and the age at which current investments alone would reach the target.

#### Scenario: Coast number discounts the target back to today

- **WHEN** the retirement target is 10,000,000, the real investment return is 4%, current age is 30, and the coast age is 65
- **THEN** the Coast FIRE number is `10,000,000 / (1.04)^35`

#### Scenario: Coast FIRE reached

- **WHEN** current investments are at or above the Coast FIRE number
- **THEN** the system indicates Coast FIRE is reached (the user could stop saving and still hit the target by the coast age)

#### Scenario: Coast FIRE not reached

- **WHEN** current investments are below the Coast FIRE number
- **THEN** the system reports the shortfall to Coast FIRE

### Requirement: Cashflow events in projection

The system SHALL incorporate one-off cashflow events into the year-by-year projection so that the accumulation curve, retirement timeline, and decumulation reflect each event in its year. With no events, results SHALL be identical to the prior projection.

#### Scenario: A large outflow delays retirement

- **WHEN** a large outflow event is added during the accumulation phase
- **THEN** the projected retirement age moves later (or the shortfall increases) versus no event

#### Scenario: Backward compatibility with no events

- **WHEN** no cashflow events exist
- **THEN** the projection output matches the result computed without the events feature
