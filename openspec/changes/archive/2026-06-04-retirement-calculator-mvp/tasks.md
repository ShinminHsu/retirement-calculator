## 1. Project setup

- [x] 1.1 Scaffold the Stack: React + TypeScript + Vite, static build, add Tailwind and Recharts
- [x] 1.2 Establish app shell, routing-free single-page layout, and shared formatting utils (TWD, percent)

## 2. Data model and persistence

- [x] 2.1 Define TypeScript interfaces per the Data model and persistence design (Position, CashAccount, IncomeBudget, Assumptions, quoteCache, schemaVersion)
- [x] 2.2 Implement Local-only persistence: load/save all state to a single versioned localStorage key, no backend
- [x] 2.3 Implement Schema versioning fallback: unknown/missing version returns default empty state without crashing
- [x] 2.4 Implement Reset and data control: clear all stored data and return to default empty state
- [x] 2.5 Implement Export and import backup: download state as JSON and restore from a validated file

## 3. Portfolio tracking

- [x] 3.1 Implement Brokerage holding entry: add/edit/delete positions (account, ticker, shares), same ticker allowed across accounts
- [x] 3.2 Implement Cash and deposit accounts: multiple cash balances summed into one cash total
- [x] 3.3 Build QuoteProvider per the Quote retrieval and the CORS constraint design: TWSE OpenAPI previous-day close + manual price override, cached with as-of date
- [x] 3.4 Implement Live quote retrieval: deduplicated per-symbol fetch, optional USD symbols with USD→TWD conversion, per-symbol failure handling
- [x] 3.5 Implement Net worth aggregation: TWD total = positions + cash, with per-account and per-ticker grouping views

## 4. Income and budget model

- [x] 4.1 Implement Annual income and raise rate: current income + nominal raise compounded to retirement year
- [x] 4.2 Implement Annual spending budget: total-only or optional categories that sum to the total
- [x] 4.3 Implement Separate retirement spending: defaults to working-life total, independently adjustable
- [x] 4.4 Implement Annual savings derivation: income minus working-life spending per year, negative-savings warning
- [x] 4.5 Implement Nominal-to-real normalization: convert nominal return/raise to real using the inflation input

## 5. Retirement projection engine

- [x] 5.1 Implement Two-bucket starting assets per the Two-bucket projection in real terms, annual time step design (investment bucket at real return, cash bucket at real cash return default 0%)
- [x] 5.2 Implement Retirement target via floor-and-upside per the Floor-and-upside target and decumulation design: (retirement spending − guaranteed income×12) ÷ withdrawal rate
- [x] 5.3 Implement Accumulation projection: annual stepping, savings added to investment bucket, fixed-DCA alternative mode
- [x] 5.4 Implement Retirement feasibility and timeline: earliest age net worth ≥ target, years-from-now, shortfall when unreached
- [x] 5.5 Implement Projection curve through decumulation: draw to life-expectancy age (default 95), floor at 0, mark depletion year with warning
- [x] 5.6 Implement Interactive what-if: reactive recompute on withdrawal rate / budget / raise changes, show retirement-age delta vs prior

## 6. UI assembly and verification

- [x] 6.1 Wire portfolio, income/budget, and assumptions panels with the projection chart and result summary
- [x] 6.2 Add sliders for withdrawal rate, budget, and raise rate driving the what-if recompute
- [x] 6.3 Manually verify end-to-end with sample data: net worth, target, retirement age, depletion warning, and persistence across reload
