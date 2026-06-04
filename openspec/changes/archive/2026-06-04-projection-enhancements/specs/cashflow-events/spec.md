## ADDED Requirements

### Requirement: One-off cashflow events

The system SHALL let the user record one-off cashflow events, each with a label, an age at which it occurs, and a signed TWD amount in today's purchasing power (positive = inflow, negative = outflow). The user SHALL be able to add, edit, and delete events.

#### Scenario: Add an inflow and an outflow

- **WHEN** the user adds "年終獎金 +200,000 at age 35" and "買房頭期 −2,000,000 at age 40"
- **THEN** both events are stored with their age and signed amount

#### Scenario: Edit and delete

- **WHEN** the user edits an event's age or amount, or deletes it
- **THEN** stored events and all derived projections update accordingly

### Requirement: Events applied in the projection

The system SHALL apply each event in the projection year matching its age: inflows are added to the investment bucket; outflows are drawn from the investment bucket first and then from cash if investments are insufficient. Multiple events at the same age SHALL all apply.

#### Scenario: Inflow increases assets that year

- **WHEN** an inflow of 200,000 occurs at age 35
- **THEN** the age-35 net worth is higher than without the event by 200,000 (before that year's growth on the new amount)

#### Scenario: Outflow draws from investments then cash

- **WHEN** an outflow of 2,000,000 occurs at age 40 and investments hold only 1,500,000
- **THEN** investments go to 0 and the remaining 500,000 is taken from the cash bucket

#### Scenario: No events leaves the projection unchanged

- **WHEN** there are no cashflow events
- **THEN** the projection result is identical to the projection without the events feature
