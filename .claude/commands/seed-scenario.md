---
description: Generate a localStorage fixture that puts the app in a specific state, plus a checklist to verify it
argument-hint: <scenario, e.g. "empty" | "month-boundary" | "year">
allowed-tools: Read, Grep, Glob, Write, Bash(npm run dev:*)
---

Scenario: $ARGUMENTS — if empty, show the catalog and ask. Don't pick for the user.

No test suite, and every screen runs off one `localStorage` key. The default 10 demo rows are never
empty, never a year long, and always have a prior period — hiding almost every failure.

## 1. Pick the scenario

| Scenario | Data | Exposes |
|---|---|---|
| `empty` | `[]` | Every empty state — cards, charts, list, analytics, donut, streak |
| `single` | 1 row, today | `count` divisors, one-point `trendSeries`, 100% donut |
| `month-boundary` | 1st + last day of this and last month | `currentMonthSpending` (`analytics.ts:20`) and `isSameMonth` (`utils.ts:30`) use UTC `toISOString()` — near midnight east of Greenwich they pick the wrong month |
| `no-prior` | Current month only | `percentChange` → `null` → "no prior data", not `0%` |
| `year` | ~14 months | `pickGranularity` → week/month, every `PeriodKey`, empty buckets emitted |
| `dst` | Across Mar/Nov transitions | `rangeLengthInDays` rounds — these spans are 23h/25h |

Compose a custom one from the same rules if asked.

## 2. Build the data

Read `src/lib/types.ts` and match `Expense` exactly — stored data is trusted after only an
`Array.isArray` check, so a bad fixture renders as `NaN` rather than being rejected.

- `date` zero-padded `YYYY-MM-DD` — lexicographic filtering needs the fixed width
- `amount` ≤ 2dp, `> 0`, `≤ 1000000` (what `ExpenseForm.validate` allows)
- `category` exactly one of `EXPENSE_CATEGORIES`, else `CATEGORY_META[...]` lookups break

Compute dates relative to today in **local** time — `getFullYear()`/`getMonth()`/`getDate()` +
`padStart(2, "0")`. Never `new Date("2026-08-13")`: UTC parsing builds the timezone bug you're
testing into the fixture. Vary amounts; equal totals hide ordering bugs in `topCategory`.

## 3. Save and emit

Write the array to `.claude/fixtures/<scenario>.json`, then give these for the devtools console.
**This overwrites real data with no undo** — lead with the backup.

```js
copy(localStorage.getItem("expense-tracker:expenses"));                      // 1. back up
localStorage.setItem("expense-tracker:expenses", JSON.stringify(/*data*/));  // 2. apply, reload
localStorage.setItem("expense-tracker:expenses", /*backup*/);                // 3. restore, reload
```

`removeItem` + reload restores the 10 demo rows: seeding happens only when the key is **absent**, so
`empty` must be the string `[]`, exactly what `clearAll()` writes.

## 4. Checklist and report

What to check and what correct looks like **for this scenario**, from code you read — not a generic
tour. Always note that `/` and `/insights` mount separate `useExpenses()` copies with no `storage`
listener, so nothing syncs across routes or tabs — navigate and reload. A surface flashing its empty
state on first paint is a missing `isLoaded` gate, not a bad fixture.

Report the fixture path, row count, date span, and the behavior it exposes.
