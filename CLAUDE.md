# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run start    # run the production build
npm run lint     # next lint (eslint-config-next: core-web-vitals + typescript)
```

There is no test suite configured in this repo (no test runner in `package.json`, no `*.test.*`/`*.spec.*` files) — don't assume one exists.

## Architecture

This is a **fully client-side Next.js 14 App Router SPA** — there are no API routes (`src/app` contains no `api` directory) and no backend of any kind. Everything is one route (`src/app/page.tsx`, `"use client"`) backed entirely by the browser's `localStorage`. Keep this in mind before assuming any server-side data flow exists.

### Data layer

- `src/lib/types.ts` — the core domain type, `Expense` (`id`, `date` as ISO string, `amount`, `category`, `description`, `createdAt`), plus `ExpenseCategory` and `ExpenseFilters`.
- `src/lib/storage.ts` — `useExpenses()` is the single source of truth for expense data. On first mount it loads from `localStorage` (key `expense-tracker:expenses`), seeding 10 demo rows if nothing is stored yet; every subsequent state change is written back to `localStorage` in a `useEffect`. Exposes `addExpense`/`updateExpense`/`deleteExpense`/`clearAll`.
- `src/lib/analytics.ts` — pure functions over `Expense[]`. Two layers: the original aggregates (totals, category breakdowns, monthly trend) consumed by `SummaryCards` and `Charts`, and the period-analysis helpers below them (`resolvePeriod`, `previousRange`, `expensesInRange`, `statsForRange`, `categoryComparison`, `trendSeries`, `pickGranularity`) that drive the analytics dashboard.
- `src/lib/categories.ts` — `CATEGORY_META`, the single source of truth mapping each `ExpenseCategory` to its display color, badge class, and emoji icon; used by both the charts and `CategoryBadge`.
- `src/lib/utils.ts` — generic formatting helpers (`formatCurrency`, `formatDate`, `todayISO`, `monthKey`).

`src/app/page.tsx` owns all top-level UI state (filters, which modal is open, toast) and derives `filteredExpenses` via `useMemo` from `useExpenses()` + the current `ExpenseFilters`. That derived, filtered list — not the raw `expenses` array — is what gets passed down to the list view and to export.

### Component structure

`src/components/` holds general dashboard UI: `ExpenseForm`, `ExpenseList`, `FilterBar`, `Charts` (recharts), `SummaryCards`, `CategoryBadge`, `Modal`, `ConfirmDialog`, `Toast`. These are conventional presentational components driven by props from `page.tsx`.

Two sub-features live in their own directories and are documented separately below: `src/components/analytics/` and `src/components/cloud-export/`.

### Analytics dashboard (`src/components/analytics/` + period helpers in `src/lib/analytics.ts`)

`AnalyticsDashboard.tsx` is rendered in `page.tsx` directly below `Charts` and owns its own period state — it is *not* wired to the page's `ExpenseFilters`. It receives the full `expenses` array and slices it by the selected period itself.

- Period keys (`thisMonth`, `lastMonth`, `last3Months`, `last6Months`, `yearToDate`, `allTime`) resolve to a concrete `DateRange` via `resolvePeriod`; every period except `allTime` is compared against the equally-long range immediately preceding it (`previousRange`).
- Trend granularity is chosen by range length in `pickGranularity`: day (≤31), week (≤120), month beyond that. `trendSeries` emits every bucket including empty ones so the x-axis stays continuous.
- **Dates are parsed as local midnight** by an internal `parseISO`, not `new Date(iso)` — the latter parses as UTC and shifts expenses into the wrong bucket west of Greenwich. Keep that when adding date logic.
- `percentChange` returns `null` when the baseline is 0 so the UI can show "No prior data" instead of a misleading +100%. `allTime` has no comparison range at all.
- **Accessibility note:** `CATEGORY_META`'s colors are not colorblind-safe — Entertainment (`#a855f7`) and Transportation (`#3b82f6`) are near-identical under deuteranopia (ΔE 0.9). `CategoryBreakdown` therefore direct-labels every row with name and amount, so color never carries identity alone. Preserve that if you restyle it. The pre-existing pie chart in `Charts.tsx` does still rely on color to separate slices.

### Export Center (`src/components/cloud-export/` + `src/lib/cloudExport/`)

A self-contained sub-feature with its own state, types, and persistence, separate from the main expense data flow:

- `ExportCenter.tsx` is a tabbed modal (Overview / Templates / Destinations / Schedule / Share / History) opened from `ExportCenterTrigger` in the page header.
- `lib/cloudExport/storage.ts`'s `useExportCenterState()` persists connections/schedules/shares/history to its own `localStorage` key, independent of `useExpenses()`.
- `lib/cloudExport/templates.ts` (`applyTemplate`) shapes the expense list per report template (tax report, monthly summary, category analysis, full export); `lib/cloudExport/report.ts` builds the actual CSV/PDF `Blob` (via `jspdf`/`jspdf-autotable`).
- **Important:** only the local CSV/PDF download path (`cards/DownloadCard.tsx`) does real work. Email, Google Sheets, Dropbox, OneDrive, and scheduled/recurring exports are simulated with fake latency (`lib/cloudExport/simulate.ts`) and are explicitly labeled as a demo in the UI — there is no real OAuth, email delivery, or cloud sync behind them. Don't treat those integrations as functional when reasoning about behavior.

### Conventions

- Path alias `@/*` → `./src/*` (see `tsconfig.json`).
- Styling is Tailwind utility classes inline in JSX; `src/app/globals.css` is only used for a couple of custom `@keyframes` animations (modal/drawer entrance). No CSS modules.
- TypeScript `strict` mode is on.
- All persisted state (both `useExpenses` and `useExportCenterState`) follows the same pattern: load once in a mount `useEffect` with a try/catch around `JSON.parse` (falling back to an empty/default state on corrupt data), then re-serialize to `localStorage` on every state change in a second `useEffect` gated by an `isLoaded` flag.
