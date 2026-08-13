# ExpenseTracker

A personal expense tracker built with Next.js 14 — add and categorise expenses, see where the money goes, and export the results to CSV or PDF.

**Everything runs in the browser.** There is no backend, no database, and no API routes: expenses live in `localStorage`, and all analysis and export happen client-side.

## Features

**Expense management** — add, edit and delete expenses across six categories (Food, Transportation, Entertainment, Shopping, Bills, Other), with search and date-range filtering. On first run the app seeds ten demo expenses so there's something to look at.

**Analytics dashboard** — pick a period (this month, last month, 3/6 months, year to date, all time) and see totals, average per day, and average transaction, each compared against the equivalent preceding period. Includes a spending trend chart whose granularity adapts to the range (daily → weekly → monthly) and a ranked category breakdown with per-category change.

**Export Center** — a tabbed modal for report templates (tax report, monthly summary, category analysis, full export), destinations, scheduling, and share links.

> [!IMPORTANT]
> **Only the CSV and PDF download works for real.** Email delivery, Google Sheets, Dropbox, OneDrive, scheduled exports, and share links are a UI demo — they simulate latency and report success without doing anything. There is no OAuth, no cloud sync, and no email behind them. The download lives on the Export Center's **Destinations** tab.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # next lint
```

There is **no test suite** in this repo — no runner, no `*.test.*` files. `lint` and `build` are the only automated checks.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · [recharts](https://recharts.org) for charts · [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable for PDF export

## Project structure

```
src/
  app/page.tsx              single route; owns filters, modals, toast
  components/               dashboard UI (form, list, charts, summary)
  components/analytics/     analytics dashboard
  components/cloud-export/  Export Center
  lib/
    types.ts                Expense domain type
    storage.ts              useExpenses() — localStorage persistence
    analytics.ts            aggregates + period analysis (pure functions)
    categories.ts           CATEGORY_META — colours, icons, badges
    cloudExport/            templates, report building, simulation
```

`CLAUDE.md` has a fuller architectural tour, including the conventions worth preserving when editing.

## Known issues

- **Chart colours are not colourblind-safe.** In `CATEGORY_META`, Entertainment (`#a855f7`) and Transportation (`#3b82f6`) are near-indistinguishable under deuteranopia. The analytics category breakdown works around this by labelling every row, but the pie chart in `Charts.tsx` still separates those slices by colour alone.
- **No automated tests** cover the date/period logic in `analytics.ts`.

## Branches

`master` is the shipped app. `feature-data-export-v1` and `feature-data-export-v2` are earlier, unmerged export implementations kept for reference — see `code-analysis.md` for the comparison that led to the current design. Neither merges cleanly into `master` any more.
