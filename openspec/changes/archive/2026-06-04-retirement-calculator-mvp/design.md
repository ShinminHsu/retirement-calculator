## Context

A single-user, Taiwan-focused retirement calculator that runs entirely in the browser with no backend and no login. Data lives in localStorage. The app reads live quotes/FX only as read-only lookups. Three concerns interact: portfolio valuation (multi-brokerage holdings + cash), an income/budget model that drives yearly savings, and a projection engine that answers "when can I retire" under a floor-and-upside framework. Everything is computed in today's purchasing power (real terms).

## Goals / Non-Goals

**Goals:**

- Pure static frontend, deployable as files; all financial inputs stay on-device.
- Accurate-enough deterministic projection: two-bucket assets (invest vs cash), income-minus-spending savings with raises, floor-and-upside target, adjustable withdrawal rate.
- Live TWD net worth from multi-account holdings with deduplicated quote fetches and optional foreign (USD) holdings.
- Interactive what-if: moving withdrawal rate / budget / raise rate instantly reflows retirement age and the chart.

**Non-Goals:**

- No Monte Carlo / sequence-of-returns simulation in MVP (deterministic single-rate only).
- No built-in 勞保/勞退 formula engine — guaranteed income is a manually entered monthly figure.
- No per-holding return assumptions — one blended real return for the whole investment bucket.
- No irregular one-off cashflow events (bonus, house down-payment) in MVP; smooth income/spending model only.
- No accounts, sync, or server persistence.

## Decisions

### Stack: React + TypeScript + Vite, static build

React + Vite + TypeScript for a fast single-page app; Tailwind for styling; Recharts for the projection chart. Chosen over a framework with a server (Next.js) because there is no backend requirement and static hosting keeps data on-device. Vite's static output can be opened from any static host or run locally.

### Quote retrieval and the CORS constraint

Browser `fetch` to Yahoo Finance / TWSE intraday endpoints is normally blocked by CORS, which conflicts with "no backend." Decision: a pluggable `QuoteProvider` interface with two layers — (1) auto-fetch the **previous-day close** from the CORS-permitting TWSE OpenAPI for Taiwan equities, and (2) **manual price entry as a first-class fallback** that can override any auto-fetched price. The MVP ships these two only; no third-party CORS proxy and no intraday source. Quotes are cached in localStorage with a timestamp; prices are shown with their as-of date so the user sees they are prior-day close. Alternatives rejected: a bundled proxy (reintroduces a backend) and a third-party CORS proxy as default (leaks ticker symbols off-device). Intraday auto-quotes are deferred to a later version.

### Two-bucket projection in real terms, annual time step

Projection steps year by year in today's TWD. Inputs are entered nominally (return, raise, inflation) and converted to real: `real = (1+nominal)/(1+inflation) − 1`. Each year: investment bucket grows at real investment return then receives that year's savings (income − working-life spending, with income compounding the real raise rate); cash bucket grows at real cash return (default 0%). Annual stepping (not monthly) is chosen for chart clarity and simplicity; the simplified fixed-DCA mode approximates monthly contributions by their annual sum. Trade-off: annual stepping slightly misstates within-year compounding — acceptable at this horizon.

### Floor-and-upside target and decumulation

Target = (retirement annual spending − guaranteed monthly income × 12) ÷ withdrawal rate. Retirement age = first projected year net worth ≥ target. Post-retirement years subtract the real gap from the portfolio (held in real terms, so no inflation escalation needed) to extend the chart into decumulation. The decumulation curve is drawn to a configurable life-expectancy age (default 95) and floored at 0 — it never goes negative; if the portfolio is exhausted before age 95, the curve flattens at 0 and the depletion year is marked with a warning ("資產在 N 歲耗盡"). Withdrawal rate, budget, and raise rate are reactive inputs that trigger full recompute; the prior retirement age is retained to display the delta.

### Data model and persistence

TypeScript interfaces persisted under a single versioned localStorage key:
`Position { id, account, ticker, shares, currency }`, `CashAccount { id, label, amountTwd }`, `IncomeBudget { annualIncome, nominalRaiseRate, workingSpending, spendingCategories?, retirementSpending }`, `Assumptions { nominalReturn, inflation, realCashReturn, withdrawalRate, guaranteedMonthlyIncome, currentAge, horizonAge }`, plus `quoteCache { ticker → { price, asOf } }` and a `schemaVersion`. On load, unknown/missing version → default empty state without crashing.

## Risks / Trade-offs

- [Browser CORS blocks auto quotes] → Ship manual price entry as a supported path; cache last good prices; document which sources are CORS-friendly.
- [Deterministic single-rate is over-confident vs real markets] → Surface that it is a planning estimate; expose withdrawal rate and return as adjustable; flag Monte Carlo as a v2 follow-up.
- [Quote-source endpoints are unofficial/unstable] → Isolate behind `QuoteProvider`; failures are per-symbol and never discard the rest of the portfolio.
- [Annual stepping misstates within-year compounding] → Acceptable at multi-year horizon; revisit if precision complaints arise.
- [User enters nominal vs real inconsistently] → Single inflation input drives all conversions; UI labels every rate field as nominal.

## Open Questions

- None blocking MVP. (Resolved: auto-quotes = TWSE OpenAPI previous-day close + manual override, no proxy/intraday; decumulation chart = draw to life-expectancy age default 95, floored at 0, depletion year marked with a warning.)
