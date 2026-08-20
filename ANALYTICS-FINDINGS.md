# `src/lib/analytics.ts` — findings, all resolved

Companion to `src/lib/analytics.test.ts`. Every expected value in that suite was derived by hand
from the doc comments, the function names and a calendar before the code was run. Where the code
disagreed, the test kept the derived answer and was marked `.fails`.

**All eight findings are now fixed.** The suite has no `.fails` and no skips left: every assertion
that used to record a defect is a live test.

**Suite state:** 215 passed (215), under `TZ=Europe/London`. `tsc --noEmit` and `next lint` clean.

| | Finding | Status |
|---|---|---|
| F1 | `currentMonthSpending` read the month in UTC | Fixed |
| F2 | `previousRange` gave a calendar month a partial-month baseline | Fixed — design changed |
| F3 | `statsForRange` ignored its own `range` when selecting expenses | Fixed |
| F4 | `categoryComparison` dropped categories that fell to zero | Fixed |
| F5 | `monthlyTrend` had no `reference` parameter | Fixed |
| F6 | `MonthlyTotal.label` documented a format the code didn't produce | Fixed — comment corrected |
| F7 | `rangeLengthInDays` returned a negative count for an inverted range | Fixed |
| F8 | `trendSeries` handled inverted ranges differently per granularity | Fixed |

---

## Correction to the first version of this report

The original F2 entry said the partial baseline "makes February look better than it was."
**That was backwards, and it understated the severity.** Dropping 1–3 January *shrinks* the
baseline:

- True: January £1000, February £900 → **down 10%**
- As reported: baseline £850 vs £900 → **up 5.9%**

Month-start is where rent, subscriptions and standing orders land, so the days the window dropped
were the expensive ones. The error was not a shading of the percentage — it could **invert the sign
of the reported change**. That is what settled the design question in F2 below.

---

## F1 — `currentMonthSpending` read the month in UTC

| | |
|---|---|
| **Location** | `analytics.ts:19-25` |
| **Input** | `reference` = 1 Jul 2025 00:30 BST; £150 in June, £7 in July |
| **Was** | `150` — June's total |
| **Now** | `7` — July's total |

`monthKey(reference.toISOString().slice(0, 10))` converted the reference to UTC before taking the
date. 1 July 00:30 BST is 30 June 23:30 UTC, so the key came out as `2025-06`. The window was
00:00–00:59 local on the 1st of any month during British Summer Time — roughly nine months a year.
In winter local time equals UTC and the bug was dormant, which is why it survived casual testing.

It drove the **"This month" card on the main dashboard** (`SummaryCards.tsx:19`), the most-read
number in the app, and it was wrong silently — a plausible figure, just the wrong month's. At 00:30
on the 1st the summary card and the analytics panel disagreed about what month it was, because
`resolvePeriod` reads local calendar fields and got it right.

**Fix:** `const key = monthKey(toISO(reference));`

`isSameMonth` in `utils.ts` had the identical defect. Rather than duplicate the conversion, the
offset logic already inside `todayISO()` was extracted as an exported `toISODate(date)`, and both
`todayISO()` and `isSameMonth` now go through it.

---

## F2 — `previousRange` gave a calendar month a partial-month baseline

| | |
|---|---|
| **Location** | `analytics.ts:190-240` |
| **Input** | `{start: "2025-02-01", end: "2025-02-28"}` |
| **Was** | `{start: "2025-01-04", end: "2025-01-31"}` |
| **Now** | `{start: "2025-01-01", end: "2025-01-31"}` |

This one was a **design change, not a straight bug fix** — the equal-length rule was stated in the
doc comment and in CLAUDE.md, and the code implemented it exactly. It was changed anyway, for two
reasons.

First, the sign inversion above: a month-over-month comparison that can report "up 6%" for a month
that was actually down 10% fails at the only job the analytics panel has.

Second, and decisive: **the defect was not confined to `lastMonth`.** `thisMonth` — the default
period — compared 1–19 August against 13–31 July, the *last* 19 days of the previous month. Same
mechanism, same one-directional bias: the current period contains the month-start charges and the
baseline excludes them. Two symptoms of one cause, so one rule fixes both rather than a special
case fixing half of it.

**The new rule.** A range starting on the 1st of a month is month-aligned, so it steps back by the
number of months it spans and holds its day-of-month footprint:

| Period | Range | Baseline |
|---|---|---|
| `lastMonth` | 1–28 Feb | 1–31 Jan (whole month) |
| `thisMonth` | 1–19 Aug | 1–19 Jul |
| `thisMonth` on the 31st | 1–31 Mar | 1–28 Feb (whole month) |
| `last3Months` | 1 Jun – 19 Aug | 1 Mar – 19 May |
| `last6Months` | 1 Mar – 19 Aug | 1 Sep – 19 Feb |
| `yearToDate` | 1 Jan – 19 Aug | 1 May – 19 Dec |

A range ending on the last day of its month is treated as whole months, so the baseline is whole
months too. Otherwise the day of the month is held and clamped where the target is shorter — 1–30
March compares against all of February, since there is no 30 February. Every `PERIOD_KEYS` value
except `allTime` produces a range starting on the 1st, so this covers all of them; arbitrary and
inverted ranges keep the equally-long sliding window.

**Consequence — the two ranges are no longer always the same length**, and that is correct:
comparing a 28-day February against a 31-day January is the month-over-month question. Checked
against every consumer:

- `ComparisonCards` compares `total` and `count` raw (right for whole months) and `averagePerDay`,
  which `statsForRange` normalises by each range's own length. Unaffected.
- `TrendChart` aligned by bucket index on the stated assumption that the ranges were equal-length —
  an assumption that was **already false** (it lined Feb 1 up against Jan 4). Index alignment is now
  genuinely like-for-like, day-of-month against day-of-month. Where the baseline is longer, the
  trailing buckets are clipped, because the x-axis belongs to the selected period; the cards carry
  the full totals. The comment asserting equal length was corrected.

---

## F3 — `statsForRange` ignored its own `range` when selecting expenses

| | |
|---|---|
| **Location** | `analytics.ts:246-266` |
| **Input** | `([{2025-01-02, £100}, {2025-02-02, £200}], {2025-01-01 → 2025-01-31})` |
| **Was** | total 300, count 2, avg/day 9.677, avg/txn 150 |
| **Now** | total 100, count 1, avg/day 3.226, avg/txn 100 |

`range` was read only for the `averagePerDay` divisor; everything else came from `expenses`
verbatim. That made "already narrowed by the caller" an unwritten, unchecked precondition — and the
opposite convention to `trendSeries`, which has the same-shaped signature, filters internally, and
is called three lines away in the same object literal in `AnalyticsDashboard.tsx`.

No user was affected, because the single caller happened to satisfy the precondition. It was a trap
rather than a live bug: violating it produced a plausible number, not an error.

**Fix:** filter internally via `expensesInRange`. This is idempotent — filtering an
already-filtered list by the same range is a no-op — so the existing caller is unchanged, and a
regression test asserts the two call styles now agree.

---

## F4 — `categoryComparison` dropped categories that fell to zero

| | |
|---|---|
| **Location** | `analytics.ts:279-317` |
| **Input** | current = Food £100, Shopping £50 · previous = Food £80, **Bills £500** |
| **Was** | 2 entries. Bills absent. |
| **Now** | 3 entries, incl. `{Bills, total 0, previousTotal 500, share 0, change −1}` |

The result was built by mapping over the current period's categories, so the previous period could
only contribute a `previousTotal` to a category that also existed now. A category that went from
£500 to £0 is the largest possible movement in the comparison, and it vanished.

**Fix:** build the list from categories in *either* period. Current categories keep their
descending order; dropped ones are appended and, having a total of 0, sort to the bottom — present,
but never crowding out current spending.

**Companion UI change.** `CategoryBreakdown` showed its "No spending in this period" empty state
when the array was empty. With the union, a period with no spending returns rows of zeros instead,
which would have replaced that empty state with noise. Its guard is now
`categories.every((entry) => entry.total === 0)`, preserving the previous behaviour exactly.

---

## F5 — `monthlyTrend` had no `reference` parameter

| | |
|---|---|
| **Location** | `analytics.ts:39-64` |
| **Was** | months relative to the wall clock at call time |
| **Now** | `monthlyTrend(expenses, monthsBack = 6, reference: Date = new Date())` |

`const now = new Date()` internally. Every other date-dependent export took an injectable
reference, and CLAUDE.md calls that parameter "the only thing making this logic deterministic" —
while listing every function except this one.

No user-visible defect; it was the only export that could not be tested without faking the clock.
The parameter is optional, so `Charts.tsx` needed no change. **The suite no longer uses fake timers
anywhere**, and a regression test asserts two different references produce two different windows.

---

## F6 — `MonthlyTotal.label` documented a format the code didn't produce

| | |
|---|---|
| **Location** | `analytics.ts:11` |
| **Input** | March 2025 |
| **Emits** | `"Mar 25"` |
| **Documented** | `"Mar 2025"`, per `// e.g. "Mar 2026"` |

**The comment was the error, not the code** — a compact label is right for a six-column bar chart
axis, and widening it risks the labels colliding. The comment now reads `// e.g. "Mar 26"`, and the
test asserts the two-digit form as the intended contract.

---

## F7 — `rangeLengthInDays` returned a negative count for an inverted range

| | |
|---|---|
| **Location** | `analytics.ts:145-153` |
| **Input** | `{start: "2025-01-10", end: "2025-01-05"}` |
| **Was** | `-4`; `previousRange` → `{start: "2025-01-14", end: "2025-01-09"}` |
| **Now** | `0`; `previousRange` → `{start: "2025-01-09", end: "2025-01-09"}` |

An inclusive day count is a size and cannot be negative. Fed into `previousRange` it flipped the
sign of the offset and produced something that was not a valid `DateRange` at all — start five days
after end.

**Fix:** `Math.max(0, …)` on the day count, plus a `Math.max(1, …)` clamp on the divisor inside
`previousRange`'s sliding-window branch, matching the idiom already used in `statsForRange`. The
month-aligned branch additionally requires `range.start <= range.end`, so inverted ranges are
routed to the clamped path.

Unreachable in practice — `resolvePeriod` never produces an inverted range, and a passing test
asserts `start <= end` for all six `PeriodKey`s.

---

## F8 — `trendSeries` handled inverted ranges differently per granularity

| | |
|---|---|
| **Location** | `analytics.ts:340-347` |
| **Input** | `([], {start: "2025-01-10", end: "2025-01-08"}, "week")` |
| **Was** | `[{key: "2025-01-06", label: "Jan 6", total: 0}]` |
| **Now** | `[]`, matching daily granularity |

At day granularity the cursor started after `rangeEnd` and the loop never ran. At week granularity
`bucketStart` rewound the cursor to Monday 6 January, before the end bound of 8 January, so one
phantom bucket was emitted for a range containing no days. Monthly rewound further and did the same.

**Fix:** `if (range.start > range.end) return [];` at the top. Tests cover all three granularities.

---

## Testability, after the fixes

**Resolved by F5.** The suite no longer fakes the clock anywhere. Every date-dependent function is
driven by an explicit `reference`, and no test calls zero-arg `new Date()`.

**Resolved by F3.** The precondition that no test could observe from outside no longer exists.

**Still open, low priority.** The date helpers — `parseISO`, `toISO`, `addDays`, `startOfWeek`,
`bucketStart`, `advance`, `bucketLabel`, `daysInMonth` — remain module-private, so
`startOfWeek`'s Sunday branch (`day === 0 ? -6 : 1 - day`), the subtlest line in the file, is only
reachable by putting a Sunday expense through `trendSeries` and inferring the answer from which
bucket it lands in. The suite does exactly that, but a regression there surfaces as a mislabelled
chart rather than a direct failure. Smallest fix: export them, or move them to a `src/lib/dates.ts`
that both files import. The indirect coverage is genuine, so this was left alone.

**Environmental, not a defect.** Bucket labels go through `toLocaleDateString("en-US", …)`. The
assertions on `"Aug 1"` and `"Nov 24"` pass on Node 22 with full ICU; a `small-icu` build would
format differently and fail them with nothing wrong in `analytics.ts`. Noted so the failure is
recognisable. If it bites, assert bucket keys and drop the label assertions.

---

## Scope notes

**The file exports 16 functions, not the 14 in the brief.** `analytics.ts` on `master` also exports
`suggestedMonthlyBudget` and `budgetStreak` (the "Monthly insights" section). Both are heavily
date-dependent, so the suite covers them — 15 tests, all passing, no defects found. The brief's list
of exactly fourteen matches the `feature/top-categories` and `feature/top-vendors` worktrees, whose
`analytics.ts` is 301 lines and stops before that section.

**The two feature worktrees carry every one of these defects.** Their `analytics.ts` is byte-identical
to master's up to the insights section, and neither has any of this test coverage. Rebase them onto
master rather than fixing in place, or the same eight changes have to be made three times.

**Files changed:** `src/lib/analytics.ts`, `src/lib/utils.ts`,
`src/components/analytics/TrendChart.tsx` (comment only),
`src/components/analytics/CategoryBreakdown.tsx` (empty-state guard), `CLAUDE.md`.
**Added:** `src/lib/analytics.test.ts`, `vitest.config.mts`, `vitest.setup.ts`, this file.
