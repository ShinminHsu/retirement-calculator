# portfolio-tracking Specification

## Purpose

TBD - created by archiving change 'retirement-calculator-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Brokerage holding entry

The system SHALL allow the user to record stock/ETF holdings as individual positions, each consisting of a brokerage account label, a ticker symbol, and a share quantity. The system SHALL allow the same ticker to appear in multiple brokerage accounts as separate positions.

#### Scenario: Add a position

- **WHEN** the user enters brokerage account "玉山證券", ticker "0050", and 200 shares
- **THEN** the system stores a position record `{ account: "玉山證券", ticker: "0050", shares: 200 }`

#### Scenario: Same ticker across two accounts

- **WHEN** the user has "0050" with 200 shares in "玉山證券" and "0050" with 150 shares in "元大證券"
- **THEN** both are stored as distinct positions
- **AND** an aggregated-by-ticker view reports "0050" total of 350 shares

#### Scenario: Edit and delete positions

- **WHEN** the user edits a position's shares or deletes it
- **THEN** the stored data and all derived totals update accordingly

---
### Requirement: Cash and deposit accounts

The system SHALL allow the user to record one or more cash/deposit balances, each with an account label and a TWD amount. The system SHALL sum all cash balances into a single cash total used by projection.

#### Scenario: Record multiple cash accounts

- **WHEN** the user records "活存 300000" and "定存 500000"
- **THEN** the cash total is 800000 TWD

---
### Requirement: Live quote retrieval

The system SHALL fetch the current market price for each distinct ticker in the portfolio, querying each distinct symbol at most once per refresh. Taiwan-listed symbols SHALL be resolved via a market suffix (`.TW` for listed, `.TWO` for OTC). The system SHALL support optional non-TWD symbols (e.g. US equities) and convert their value to TWD using a fetched exchange rate.

#### Scenario: Deduplicated fetch

- **WHEN** "0050" appears in three positions across two accounts and the user refreshes quotes
- **THEN** the system issues exactly one price request for "0050"

#### Scenario: Foreign holding converted to TWD

- **WHEN** a position holds a USD-denominated symbol and the USD→TWD rate is fetched
- **THEN** that position's market value is reported in TWD using the fetched rate

#### Scenario: Quote source unavailable

- **WHEN** a price request fails or returns no data for a symbol
- **THEN** the system marks that symbol's price as unavailable and surfaces it to the user without discarding the rest of the portfolio
- **AND** the system SHALL retain the last successfully fetched price with its timestamp for display

---
### Requirement: Net worth aggregation

The system SHALL compute total net worth in TWD as the sum of all position market values plus the cash total. The system SHALL present holdings both grouped by brokerage account and aggregated by ticker.

#### Scenario: Total net worth

- **WHEN** invested positions total 1,200,000 TWD and cash total is 800,000 TWD
- **THEN** reported net worth is 2,000,000 TWD

#### Scenario: Two grouping views

- **WHEN** the user views the portfolio
- **THEN** the system can display per-account subtotals and a per-ticker consolidated list from the same underlying positions
