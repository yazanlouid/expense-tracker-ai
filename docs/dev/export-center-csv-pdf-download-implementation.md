# Export Center CSV/PDF Download — Implementation

**Type:** Full feature (UI + state) · **Last updated:** 2026-08-13

## Overview

Lets a user generate a CSV or PDF report of their expenses and save it directly to their device.
It's the one destination card in the Export Center that does real work — no OAuth, no server, no
simulated latency beyond a short UX delay. Everything runs synchronously in the browser: build a
`Blob`, hand it to a temporary `<a download>` link.

## Architecture / data flow

```
DestinationsTab (template picker)
  -> DownloadCard (format toggle: csv | pdf)
       -> applyTemplate(templateId, expenses)      [src/lib/cloudExport/templates.ts]
       -> buildReportBlob(format, applied)          [src/lib/cloudExport/report.ts]
       -> downloadBlob(filename, blob)               [src/lib/cloudExport/download.ts]
       -> center.addHistoryEntry(...)                 [src/lib/cloudExport/storage.ts]
```

`expenses` originates from `page.tsx`'s raw `useExpenses()` state and is passed unfiltered into
`<ExportCenter expenses={expenses} />` (`src/app/page.tsx:174-178`) — **not** the `filteredExpenses`
derived for the dashboard's list/search view. See Gotchas below.

The only persisted side effect is a `HistoryEntry` appended via `center.addHistoryEntry`, which
writes to the `expense-tracker:cloud-export-center` `localStorage` key
(`src/lib/cloudExport/storage.ts:14`). This follows the same `isLoaded`-gated load/save
`useEffect` pattern described in the project's CLAUDE.md
(`src/lib/cloudExport/storage.ts:60-68`) — load once on mount, then re-serialize on every state
change once loaded. No new/changed storage key was introduced for this feature; it reuses the
Export Center's existing state hook.

## Key files

- [`src/components/cloud-export/cards/DownloadCard.tsx:22`](../../src/components/cloud-export/cards/DownloadCard.tsx#L22) — `handleDownload`: orchestrates the whole flow (format state, template application, blob build, browser download, history logging).
- [`src/components/cloud-export/tabs/DestinationsTab.tsx:48`](../../src/components/cloud-export/tabs/DestinationsTab.tsx#L48) — renders `DownloadCard` alongside the other (simulated) destination cards, with a shared template `<select>` above them.
- [`src/components/cloud-export/tabs/TemplatesTab.tsx:22-30`](../../src/components/cloud-export/tabs/TemplatesTab.tsx#L22-L30) — computes a live record-count/total preview per template by calling `applyTemplate` for each `TEMPLATE_ID` against the current `expenses`.
- [`src/components/cloud-export/tabs/HistoryTab.tsx:18-22`](../../src/components/cloud-export/tabs/HistoryTab.tsx#L18-L22) — "Download again" re-runs `applyTemplate` + `buildReportBlob` + `downloadBlob` for a past history entry (see Gotchas — format is hardcoded).
- [`src/lib/cloudExport/templates.ts:19`](../../src/lib/cloudExport/templates.ts#L19) — `applyTemplate`: filters/sorts `expenses` and produces title/filename/grouping metadata per `TemplateId` (`tax-report`, `monthly-summary`, `category-analysis`, `all-data`).
- [`src/lib/cloudExport/report.ts:22`](../../src/lib/cloudExport/report.ts#L22) — `buildReportCSV`: hand-rolled CSV serialization with per-category subtotal rows when `grouped`.
- [`src/lib/cloudExport/report.ts:47`](../../src/lib/cloudExport/report.ts#L47) — `buildReportPDF`: builds a PDF via `jsPDF` + `jspdf-autotable`.
- [`src/lib/cloudExport/report.ts:92`](../../src/lib/cloudExport/report.ts#L92) — `buildReportBlob`: format dispatcher used by both `DownloadCard` and `HistoryTab`.
- [`src/lib/cloudExport/download.ts:1`](../../src/lib/cloudExport/download.ts#L1) — `downloadBlob`: creates an object URL, clicks a temporary `<a download>`, revokes the URL.
- [`src/lib/cloudExport/storage.ts:119`](../../src/lib/cloudExport/storage.ts#L119) — `addHistoryEntry`: appends a `HistoryEntry`, capped at `HISTORY_LIMIT` (30, `storage.ts:15`).

## Types & interfaces

From [`src/lib/cloudExport/types.ts`](../../src/lib/cloudExport/types.ts):

- `TemplateId` (`:57`) — `"tax-report" | "monthly-summary" | "category-analysis" | "all-data"`.
- `HistoryEntry` (`:129-138`) — `{ id, timestamp, templateId, destination, recordCount, totalAmount, status, detail }`; `destination` is `"download"` for this feature.

From [`src/lib/cloudExport/templates.ts:4-9`](../../src/lib/cloudExport/templates.ts#L4-L9):

- `AppliedTemplate` — `{ expenses, title, filenameBase, grouped }`, the shared shape both `buildReportCSV` and `buildReportPDF` consume.

Uses `Expense` from `src/lib/types.ts` unchanged — no new fields.

## Edge cases & gotchas

- **Export always uses the full expense list, not the filtered one.** `page.tsx` passes its raw `expenses` (not `filteredExpenses`) into `ExportCenter` (`src/app/page.tsx:177`), so any active search/category/date filter on the main dashboard has no effect on what gets exported.
- **"Download again" from History always regenerates a CSV**, even if the original export was a PDF — `HistoryTab.tsx:20` hardcodes `buildReportBlob("csv", applied)`. The button gives no indication the format may differ from what was originally downloaded.
- **The 250ms delay in `DownloadCard.handleDownload` (`DownloadCard.tsx:25`) is pure UX polish**, not simulated network latency — unlike the other destination cards (email, Google Sheets, Dropbox, OneDrive), this path does real, synchronous work; the delay only exists so the "Preparing…" busy state is visible.
- **Template date filters are keyed off the browser's local clock.** `tax-report` and `monthly-summary` use `e.date.startsWith(String(currentYear()))` / `startsWith(currentMonthKey)` (`templates.ts:11-17, 24-25, 34-36`), so results depend on the device's system time at generation, not a fixed "as of" date.
- **Category grouping order is first-seen order, not alphabetical**, in both `buildReportCSV` and `buildReportPDF` (`report.ts:12-20` `groupByCategory` uses `Map` insertion order). This happens to read as alphabetical for `category-analysis` only because `applyTemplate` pre-sorts that template's list by category (`templates.ts:45`) before grouping.
- **Empty results still produce a valid file.** If a template matches zero expenses (e.g. `tax-report` for a year with no data), `buildReportCSV`/`buildReportPDF` still emit a header row and a $0.00 total — `DownloadCard` has no empty-state guard.
- **This is the only non-simulated destination.** Per the project's CLAUDE.md, email, Google Sheets, Dropbox, and OneDrive cards use `lib/cloudExport/simulate.ts` fake latency; only this CSV/PDF download path (and its `report.ts`/`download.ts` dependencies) does real file generation.

## Related documentation

- [How to export expenses to CSV or PDF](../user/how-to-export-expenses-to-csv-or-pdf.md)
