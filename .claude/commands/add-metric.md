---
description: Add a spending metric as a pure function in analytics.ts and surface it in the UI
argument-hint: <what to measure, e.g. "average weekend vs weekday spend">
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm run lint), Bash(npx tsc --noEmit)
---

Metric: $ARGUMENTS

Too vague to pin down a formula? Ask what it answers and where it belongs, then stop.

## 1. Don't duplicate

Read `src/lib/analytics.ts` first. If an existing export answers it, say so and stop — the fix is a
call site. If one nearly does, compose on it. Otherwise write it beside its neighbours in the right
layer: aggregates (no date window), period analysis (`DateRange`, compares against `previousRange`),
or monthly insights (`/insights`).

## 2. Write the function

- Pure: no React, no I/O, no mutating the input. `Expense[]` first param.
- Return `null`, not `0`, when there's no answer — the UI shows an empty state, not a fake number.
- Date-dependent → last param `reference: Date = new Date()`, threaded through. It's the only thing
  making this logic deterministic.
- **Never `new Date(iso)`** — UTC midnight, a day early west of Greenwich, wrong bucket. Use the
  module-private `parseISO`/`toISO`/`addDays`/`startOfWeek`/`daysInMonth`; don't re-implement or
  export them. Compare dates as strings — `YYYY-MM-DD` is fixed-width, so `>=` works.
- Guard every divisor: `total > 0 ? part / total : 0`. Empty periods are normal; unguarded → `NaN%`.
- Reuse `resolvePeriod`/`expensesInRange`/`PERIOD_LABELS` over a new range concept.
- Doc-comment the *why* behind judgment calls (which window, what if no history), like
  `suggestedMonthlyBudget`.

## 3. Surface it

Headline → `SummaryCards.tsx` (a `CardDef`); period-scoped with comparison →
`analytics/AnalyticsDashboard.tsx`; this month → `MonthlyInsights.tsx`; chart → `Charts.tsx`.

- These all get the **raw** `expenses` — only `ExpenseList` gets `filteredExpenses`. Don't wire
  filters in or "fix" the split unasked.
- In `AnalyticsDashboard`, compute inside the existing `useMemo` on `[expenses, period]`; handle
  `allTime` → no comparison range → `null`, like `priorStats`.
- **An explicit empty state is required** — `null` renders as that, never `$0.00`. `percentChange`
  returns `null` on a zero baseline deliberately, so render "no prior data"; `?? 0` turns unknown
  into a confident, wrong `0%`.
- Charts must not encode by color alone — the palette isn't colorblind-safe (`#a855f7` ≈ `#3b82f6`
  under deuteranopia). Direct-label rows like `CategoryBreakdown`, or `role="img"` + a full
  `aria-label` like `MonthlyInsights`.

## 4. Verify and report

`npm run lint` and `npx tsc --noEmit` — both clean on `master`, so any output is yours. No test
suite: don't run `npm test` or add a runner. `/seed-scenario` supplies edge-case data to check
against.

Report the signature, layer, formula, what it returns with no data, files as `file:line`, and
lint/tsc results.
