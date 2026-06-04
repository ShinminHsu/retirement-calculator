# local-data-persistence Specification

## Purpose

TBD - created by archiving change 'retirement-calculator-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Local-only persistence

The system SHALL persist all user-entered data (positions, cash accounts, income, budget, assumptions) in the browser's localStorage. The system SHALL NOT transmit user data to any backend or require login. The only outbound requests permitted are read-only quote and exchange-rate lookups.

#### Scenario: Data survives reload

- **WHEN** the user enters data and reloads the page
- **THEN** all previously entered data is restored from localStorage

#### Scenario: No backend dependency

- **WHEN** the application runs
- **THEN** it requires no server-side account or database, and user financial inputs are never sent off-device except as ticker symbols within quote/rate requests

---
### Requirement: Reset and data control

The system SHALL allow the user to clear all stored data. After clearing, the application SHALL return to its default empty state.

#### Scenario: Clear all data

- **WHEN** the user invokes "clear all data"
- **THEN** localStorage for the application is emptied and the UI shows the default empty state

---
### Requirement: Export and import backup

The system SHALL let the user export all stored data to a downloadable JSON file and import a previously exported file to restore that state. Import SHALL validate the schema version and reject unrecognized files without altering current data. The export/import SHALL happen entirely on-device with no upload.

#### Scenario: Export then re-import

- **WHEN** the user exports a backup and later imports that same file
- **THEN** the restored state matches the exported positions, cash, income, and assumptions

#### Scenario: Import rejects an invalid file

- **WHEN** the user imports a file that is not a valid backup
- **THEN** the system reports an import error and leaves the current data unchanged

---
### Requirement: Schema versioning

The system SHALL tag persisted data with a schema version so that future format changes can be detected. When stored data is missing or its version is unrecognized, the system SHALL fall back to the default empty state without crashing.

#### Scenario: Unrecognized or absent data

- **WHEN** no stored data exists or the stored version is unrecognized
- **THEN** the application initializes with default empty state and does not error
