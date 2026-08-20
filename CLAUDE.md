# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A personal expense tracker: a **fully client-side Next.js 14 App Router app**. No backend,
database, API routes, auth, or network calls of any kind. Expenses live in `localStorage`; every
total, chart, and export is computed in the browser. "Export" means serialize an array to a `Blob`
and click a synthetic `<a download>`; "cloud sync" means `setTimeout`. Charts are recharts.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build
npm run lint     # next lint (core-web-vitals + typescript)
npm test         # vitest run
npx tsc --noEmit # typecheck; not a package script, but the fastest full check
```

The only test suite is `src/lib/analytics.test.ts` (Vitest). It runs under a **fixed
`TZ=Europe/London`**, set in `vitest.config.mts` and enforced by `vitest.setup.ts`, which throws if
the resolved offsets aren't GMT in January and BST in July — this module's defects are invisible
under UTC. Two rules when extending it: never call zero-arg `new Date()` in a test, and pass every
`reference: Date` explicitly, or the suite starts changing its answer tomorrow. Derive expected
values from the docs and a calendar rather than from what the code currently returns.

`test`, `lint` and `tsc` are all currently clean, so any error you see is yours.

## Worktrees

Three sibling worktrees of one repo: `expense-tracker-ai/` (`master` — work here by default),
`expense-tracker-top-categories/`, `expense-tracker-top-vendors/`. They share one object store:
commits are visible across them, edits are not. `.claude/worktrees/` is gitignored — never commit
under it. `feature-data-export-v1`/`v2` are unmerged reference branches; `code-analysis.md`
describes them, not the current tree.

## How data flows

`localStorage` → `useExpenses()` → `page.tsx` → components.

`page.tsx` owns top-level UI state (filters, open modal, toast) and derives `filteredExpenses` via
`useMemo`. **Only `ExpenseList` gets the filtered list** — `SummaryCards`, `Charts`,
`AnalyticsDashboard`, and `ExportCenter` all receive the raw `expenses` array, so filtering the
table does not narrow what is charted or exported. Deliberate, but surprising: flag it in docs,
don't "fix" it unasked. `AnalyticsDashboard` also holds its own `PeriodKey` state and ignores
`ExpenseFilters` entirely.

## Data layer (`src/lib/`)

- `types.ts` — `Expense` (`date` is `YYYY-MM-DD`), `ExpenseInput`, `ExpenseFilters`. Adding a
  category to `EXPENSE_CATEGORIES` breaks `CATEGORY_META`'s typecheck until you give it metadata —
  keep that coupling.
- `storage.ts` — `useExpenses()`: expenses + `isLoaded` + add/update/delete/clearAll.
- `categories.ts` — `CATEGORY_META`, the single source of truth for every category color, badge
  class, and icon. Never hardcode a category color at a call site.
- `cloudExport/storage.ts` — `useExportCenterState()`, an independent store under its own key.

### Persistence pattern — follow it exactly for any new persisted state

1. `useState` with an empty default; never read `localStorage` during render.
2. Mount `useEffect` that loads inside `try/catch` around `JSON.parse`, falls back to empty on
   corrupt data, then sets `isLoaded`.
3. Second `useEffect`, **gated on `isLoaded`**, re-serializing on every change.

The gate is load-bearing: without it the initial empty state overwrites stored data on first
render. Consequences:

- **Seeding happens only when the key is absent.** A fresh browser gets 10 demo rows; `clearAll()`
  writes `[]`, so cleared stays cleared — delete `expense-tracker:expenses` to reseed.
- **Stored data is trusted after only an `Array.isArray` check** — no per-field validation.
  Changing the `Expense` shape changes a persisted format with no migration path.
- **`useExpenses()` is a plain hook, not a context.** `/` and `/insights` each mount their own copy
  and nothing listens for the `storage` event, so state doesn't sync across routes or tabs; last
  write wins. Sharing live state means lifting to a provider, not a second hook instance.

## Dates — the trap that breaks things quietly

Dates are `YYYY-MM-DD` strings and range filtering compares them **lexicographically**
(`expensesInRange`), which is correct only because the format is zero-padded and fixed-width.
Don't switch to `Date` objects for filtering.

- **Never `new Date(iso)`** — it parses as UTC midnight, the previous day west of Greenwich, and
  silently shifts expenses into the wrong bucket. Use the local-midnight split
  (`iso.split("-").map(Number)` → `new Date(y, m - 1, d)`), as `parseISO` in `analytics.ts` and
  `formatDate` in `utils.ts` do.
- Back to a string: `toISO` (analytics) or `toISODate`/`todayISO()` (utils), which take the local
  calendar fields instead of calling `toISOString()` on a local date. **Never derive a day or a
  month key from `toISOString()`** — between midnight and 01:00 BST it reports yesterday, which
  files an expense under the wrong day and, on the 1st, the wrong month. `rangeLengthInDays` rounds
  its ms division because DST makes some spans 23 or 25 hours, and floors at 0.
- Every date-dependent function takes an injectable `reference: Date = new Date()`
  (`resolvePeriod`, `currentMonthSpending`, `monthlyTrend`, `suggestedMonthlyBudget`,
  `budgetStreak`). Preserve that parameter — it's the only thing making this logic deterministic,
  and the test suite drives all of them through it.

## `src/lib/analytics.ts` — three layers, all pure

No React, no I/O. New aggregation goes here, not inline in a component.

1. **Aggregates** — `totalSpending`, `spendingByCategory`, `topCategory`, `monthlyTrend`; feed
   `SummaryCards` and `Charts`.
2. **Period analysis** — `PERIOD_KEYS`/`PERIOD_LABELS`, `resolvePeriod`, `previousRange`,
   `expensesInRange`, `statsForRange`, `percentChange`, `categoryComparison`, `pickGranularity`,
   `trendSeries`. `allTime` has no preceding range, so callers must handle `null`.
   `previousRange` is **month-aligned**: a range starting on the 1st steps back whole months and
   keeps its day-of-month footprint (February vs all of January; 1–19 Aug vs 1–19 Jul), so the two
   ranges are deliberately *not* always equal-length — recurring charges land on the 1st and a
   sliding window drops them from the baseline. Anything else gets the equally-long preceding
   window. `statsForRange` and `trendSeries` both filter by their `range` argument, so passing the
   full list is always safe — keep those two consistent. `categoryComparison` covers categories in
   *either* period, so a category that dropped to zero still appears (`CategoryBreakdown` treats an
   all-zero result as its empty state). `percentChange` returns `null` on a zero baseline so the UI
   can say "no prior data" instead of +100% — don't coerce it to 0. `pickGranularity`: day ≤ 31
   days, week ≤ 120, month beyond. `trendSeries` emits every bucket including empty ones to keep
   the x-axis continuous, weeks starting Monday.
3. **Monthly insights** — `suggestedMonthlyBudget`, `budgetStreak`. There is no budget in the
   domain model, so the target derives from the user's own history: last calendar month's total →
   lifetime daily average scaled to a month → `null` (rendered as an empty state; never invent a
   number). It uses a *closed* month so today's spending can't move its own goalposts, and the
   streak paces the **cumulative** month-to-date total against a pro-rated allowance, not per-day
   spend — the comments explaining why should survive refactors.

## Routes and components

- `/` (`src/app/page.tsx`) — dashboard: cards, charts, analytics, filter bar, list, modals, toast.
- `/insights` (`src/app/insights/page.tsx`) — `MonthlyInsights`: this month's donut by category,
  top-3 breakdown, budget streak.

Both are `"use client"` and render the same spinner while `!isLoaded` — keep it; it prevents a
hydration mismatch and a flash of "no expenses". `layout.tsx` is the only server component.

Validation lives only in `ExpenseForm.validate` (amount > 0 and ≤ 1,000,000; description 2–200
chars; date required, capped at today) — `addExpense`/`updateExpense` accept anything, so new write
paths must validate themselves. `Modal` hardcodes `aria-labelledby="modal-title"`, so only one may
be open at a time.

## Export Center — what's real and what isn't

`src/components/cloud-export/` + `src/lib/cloudExport/`: a tabbed modal with its own state and key.

**Only the CSV/PDF download does real work** (`cards/DownloadCard.tsx` → `applyTemplate` →
`buildReportBlob` → `downloadBlob` → `addHistoryEntry`). Everything else is a UI-labeled
simulation: email/Sheets/Dropbox/OneDrive use fake latency from `simulate.ts`; schedules are stored
and described but **nothing executes them** (no timer, worker, or server); share links are a
`randomToken()` plus a QR code of a URL that resolves to nothing; history caps at 30 entries. Never
describe these as working — making one real requires a backend.

## Conventions

- Path alias `@/*` → `./src/*`. TypeScript `strict`.
- Domain unions come from `as const` tuples (`EXPENSE_CATEGORIES`, `PERIOD_KEYS`,
  `DESTINATION_IDS`, `TEMPLATE_IDS`) with `(typeof X)[number]` — don't hand-write string unions.
- One default-exported component per file; `"use client"` on every component and hook module.
- Tailwind utilities inline in JSX. No CSS modules, no component library, light theme only;
  `globals.css` holds only the directives, two CSS variables, and the Export Center keyframes.
- Icons are emoji glyphs or hand-inlined 20×20 SVG paths — there's no icon package, don't add one.
- Money is a plain `number`, rounded to 2dp on submit, formatted via `formatCurrency` (Intl,
  hardcoded en-US/USD); dates via `formatDate`. Sums are naive float `reduce` — don't depend on
  exact cents.
- Every list, chart, and card has an explicit empty state. New ones need one too.

## Accessibility that's load-bearing

`CATEGORY_META`'s palette is **not colorblind-safe** — Entertainment (`#a855f7`) and
Transportation (`#3b82f6`) are near-identical under deuteranopia. Two components compensate and
must keep doing so: `analytics/CategoryBreakdown` direct-labels every row, and `MonthlyInsights`
gives the donut an `aria-label` naming every slice and amount. `Charts.tsx`'s pie is the known gap
— don't add more color-only encoding.

## Working agreements

- New screen → `src/app/<route>/page.tsx`, `"use client"`, `useExpenses()`, spinner while
  `!isLoaded`.
- New aggregation → a pure function in `analytics.ts` taking `Expense[]` (plus `reference: Date` if
  it touches dates), not computed in the component body.
- Reuse `resolvePeriod`/`expensesInRange`/`PERIOD_LABELS` and `analytics/PeriodSelector` instead of
  new date math.
- New persisted state → its own `expense-tracker:*` key and the three-step pattern above.
- Guard every divisor (`total > 0 ? part / total : 0`); an unguarded share renders as `NaN%`.
- Finish with `npm test`, `npm run lint` and `npx tsc --noEmit`.

Don't, without asking: add API routes or any server-side path; introduce a state/UI/icon library;
add dark mode; reformat untouched files; delete the `feature-data-export-*` branches.

`docs/dev/` and `docs/user/` are written by the `/document-feature` command — read it before
documenting anything and match the existing files.
