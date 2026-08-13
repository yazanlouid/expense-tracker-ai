import type { Expense, ExpenseCategory } from "./types";
import { monthKey } from "./utils";

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

export interface MonthlyTotal {
  month: string; // YYYY-MM
  label: string; // e.g. "Mar 2026"
  total: number;
}

export function totalSpending(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function currentMonthSpending(expenses: Expense[], reference: Date = new Date()): number {
  const key = monthKey(reference.toISOString().slice(0, 10));
  return expenses.filter((e) => monthKey(e.date) === key).reduce((sum, e) => sum + e.amount, 0);
}

export function spendingByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function topCategory(expenses: Expense[]): CategoryTotal | null {
  const totals = spendingByCategory(expenses);
  return totals.length > 0 ? totals[0] : null;
}

export function monthlyTrend(expenses: Expense[], monthsBack = 6): MonthlyTotal[] {
  const now = new Date();
  const months: MonthlyTotal[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    months.push({ month: key, label, total: 0 });
  }

  const byMonth = new Map(months.map((m) => [m.month, m]));
  for (const e of expenses) {
    const key = monthKey(e.date);
    const bucket = byMonth.get(key);
    if (bucket) bucket.total += e.amount;
  }

  return months;
}

/* ------------------------------------------------------------------ *
 * Period analysis
 *
 * Everything below powers the analytics dashboard: resolving a named
 * period to a concrete date range, comparing it against the equivalent
 * preceding range, and bucketing a range into a trend series.
 * ------------------------------------------------------------------ */

export const PERIOD_KEYS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "last6Months",
  "yearToDate",
  "allTime",
] as const;

export type PeriodKey = (typeof PERIOD_KEYS)[number];

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  thisMonth: "This month",
  lastMonth: "Last month",
  last3Months: "Last 3 months",
  last6Months: "Last 6 months",
  yearToDate: "Year to date",
  allTime: "All time",
};

export interface DateRange {
  start: string; // ISO YYYY-MM-DD, inclusive
  end: string; // ISO YYYY-MM-DD, inclusive
}

export type Granularity = "day" | "week" | "month";

export interface TrendPoint {
  key: string; // bucket start, ISO date
  label: string; // axis label
  total: number;
}

export interface PeriodStats {
  total: number;
  count: number;
  averagePerDay: number;
  averageTransaction: number;
  top: CategoryTotal | null;
}

export interface CategoryComparison {
  category: ExpenseCategory;
  total: number;
  previousTotal: number;
  share: number; // 0..1 of the current period total
  change: number | null; // fractional change vs previous, null when previous is 0
}

/**
 * Parse an ISO date as *local* midnight. `new Date("2026-08-13")` parses as
 * UTC and can land on the previous day west of Greenwich, which would shift
 * expenses into the wrong bucket.
 */
function parseISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Inclusive day count. Rounded because DST makes some spans 23h or 25h. */
export function rangeLengthInDays(range: DateRange): number {
  const ms = parseISO(range.end).getTime() - parseISO(range.start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function resolvePeriod(
  period: PeriodKey,
  expenses: Expense[],
  reference: Date = new Date(),
): DateRange {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const today = toISO(reference);

  switch (period) {
    case "thisMonth":
      return { start: toISO(new Date(year, month, 1)), end: today };
    case "lastMonth":
      return {
        start: toISO(new Date(year, month - 1, 1)),
        end: toISO(new Date(year, month, 0)), // day 0 = last day of previous month
      };
    case "last3Months":
      return { start: toISO(new Date(year, month - 2, 1)), end: today };
    case "last6Months":
      return { start: toISO(new Date(year, month - 5, 1)), end: today };
    case "yearToDate":
      return { start: toISO(new Date(year, 0, 1)), end: today };
    case "allTime": {
      if (expenses.length === 0) return { start: today, end: today };
      let min = expenses[0].date;
      let max = expenses[0].date;
      for (const e of expenses) {
        if (e.date < min) min = e.date;
        if (e.date > max) max = e.date;
      }
      return { start: min, end: max > today ? max : today };
    }
  }
}

/** The equally-long range ending the day before `range` starts. */
export function previousRange(range: DateRange): DateRange {
  const days = rangeLengthInDays(range);
  const end = addDays(parseISO(range.start), -1);
  const start = addDays(end, -(days - 1));
  return { start: toISO(start), end: toISO(end) };
}

export function expensesInRange(expenses: Expense[], range: DateRange): Expense[] {
  return expenses.filter((e) => e.date >= range.start && e.date <= range.end);
}

export function statsForRange(expenses: Expense[], range: DateRange): PeriodStats {
  const total = totalSpending(expenses);
  const count = expenses.length;
  const days = Math.max(1, rangeLengthInDays(range));
  return {
    total,
    count,
    averagePerDay: total / days,
    averageTransaction: count > 0 ? total / count : 0,
    top: topCategory(expenses),
  };
}

/**
 * Fractional change from `previous` to `current` (0.25 === +25%).
 * Returns null when there is no baseline to compare against, so callers can
 * render "no prior data" rather than a misleading +100%.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export function categoryComparison(
  current: Expense[],
  previous: Expense[],
): CategoryComparison[] {
  const currentTotals = spendingByCategory(current);
  const previousByCategory = new Map(
    spendingByCategory(previous).map((c) => [c.category, c.total]),
  );
  const grandTotal = totalSpending(current);

  return currentTotals.map(({ category, total }) => {
    const previousTotal = previousByCategory.get(category) ?? 0;
    return {
      category,
      total,
      previousTotal,
      share: grandTotal > 0 ? total / grandTotal : 0,
      change: percentChange(total, previousTotal),
    };
  });
}

/** Daily buckets get noisy past a month or so; step up to weeks then months. */
export function pickGranularity(range: DateRange): Granularity {
  const days = rangeLengthInDays(range);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

/** Monday-based start of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday
  return addDays(date, day === 0 ? -6 : 1 - day);
}

function bucketStart(date: Date, granularity: Granularity): Date {
  if (granularity === "day") return date;
  if (granularity === "week") return startOfWeek(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function advance(date: Date, granularity: Granularity): Date {
  if (granularity === "day") return addDays(date, 1);
  if (granularity === "week") return addDays(date, 7);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function bucketLabel(date: Date, granularity: Granularity): string {
  if (granularity === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Bucket `expenses` across `range`, emitting every bucket in order including
 * empty ones so the chart keeps a continuous x-axis.
 */
export function trendSeries(
  expenses: Expense[],
  range: DateRange,
  granularity: Granularity = pickGranularity(range),
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const rangeEnd = parseISO(range.end);

  let cursor = bucketStart(parseISO(range.start), granularity);
  while (cursor <= rangeEnd) {
    points.push({ key: toISO(cursor), label: bucketLabel(cursor, granularity), total: 0 });
    cursor = advance(cursor, granularity);
  }

  if (points.length === 0) return points;

  // Walk buckets rather than the expense list so lookup stays O(1) per expense.
  const byKey = new Map(points.map((p) => [p.key, p]));
  for (const e of expensesInRange(expenses, range)) {
    const key = toISO(bucketStart(parseISO(e.date), granularity));
    const bucket = byKey.get(key);
    if (bucket) bucket.total += e.amount;
  }

  return points;
}

/* ------------------------------------------------------------------ *
 * Monthly insights
 *
 * Powers the insights screen. There is no budget anywhere in the domain
 * model, so the "budget streak" needs a target to measure against — the
 * helpers below derive one from the user's own history rather than
 * inventing a number or demanding they configure one first.
 * ------------------------------------------------------------------ */

export interface BudgetStreak {
  /** Consecutive days ending today on which month-to-date spending was on pace. */
  days: number;
  /** The month's target; null when there is no history to derive one from. */
  monthlyBudget: number | null;
  /** Share of the target allowed by today — `monthlyBudget * daysElapsed / daysInMonth`. */
  allowedSoFar: number;
  /** Month-to-date spend, for rendering the on/off pace message. */
  spentSoFar: number;
  /** The most recent off-pace day, or null when the streak covers the whole month. */
  brokenOn: string | null;
}

/**
 * The previous calendar month's total, used as the default target for this
 * month: "keep this month at or under what last month cost".
 *
 * Deliberately measured over a *closed* prior month — deriving the target from
 * a window that includes the current month would let today's spending move its
 * own goalposts. Falls back to the lifetime daily average scaled to a month
 * when last month is empty, and to null when there is no history at all, so
 * the UI can show an empty state instead of a made-up goal.
 */
export function suggestedMonthlyBudget(
  expenses: Expense[],
  reference: Date = new Date(),
): number | null {
  if (expenses.length === 0) return null;

  const lastMonth = resolvePeriod("lastMonth", expenses, reference);
  const priorExpenses = expensesInRange(expenses, lastMonth);
  if (priorExpenses.length > 0) return totalSpending(priorExpenses);

  const lifetime = resolvePeriod("allTime", expenses, reference);
  const perDay = totalSpending(expenses) / Math.max(1, rangeLengthInDays(lifetime));
  return perDay * daysInMonth(reference);
}

function daysInMonth(reference: Date): number {
  // Day 0 of the following month is the last day of this one.
  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
}

/**
 * How many days in a row, counting back from `reference`, month-to-date
 * spending has stayed within its pro-rated share of the monthly budget.
 *
 * Measured against the running total rather than each day's spend on its own:
 * most days have no expenses at all, so a per-day rule would compare every
 * actual purchase against an average dragged down by the empty days and break
 * the streak almost every time money is spent. Pacing the cumulative total is
 * both the standard "am I still on budget" question and self-healing — a quiet
 * week pulls an over-pace month back under.
 *
 * The streak is scoped to the current month, so it can never exceed the number
 * of days elapsed and resets when the budget does.
 */
export function budgetStreak(
  expenses: Expense[],
  monthlyBudget: number | null,
  reference: Date = new Date(),
): BudgetStreak {
  const range = resolvePeriod("thisMonth", expenses, reference);
  const monthExpenses = expensesInRange(expenses, range);
  const spentSoFar = totalSpending(monthExpenses);
  const daysElapsed = rangeLengthInDays(range);

  if (monthlyBudget === null) {
    return { days: 0, monthlyBudget, allowedSoFar: 0, spentSoFar, brokenOn: null };
  }

  const allowancePerDay = monthlyBudget / daysInMonth(reference);
  const allowedSoFar = allowancePerDay * daysElapsed;

  const spentPerDay = new Map<string, number>();
  for (const e of monthExpenses) {
    spentPerDay.set(e.date, (spentPerDay.get(e.date) ?? 0) + e.amount);
  }

  // Walk the month forwards once to accumulate, recording each day's verdict.
  const monthStart = parseISO(range.start);
  const onPace: boolean[] = [];
  let running = 0;
  for (let i = 0; i < daysElapsed; i++) {
    running += spentPerDay.get(toISO(addDays(monthStart, i))) ?? 0;
    onPace.push(running <= allowancePerDay * (i + 1));
  }

  let days = 0;
  for (let i = daysElapsed - 1; i >= 0; i--) {
    if (!onPace[i]) {
      return {
        days,
        monthlyBudget,
        allowedSoFar,
        spentSoFar,
        brokenOn: toISO(addDays(monthStart, i)),
      };
    }
    days += 1;
  }

  return { days, monthlyBudget, allowedSoFar, spentSoFar, brokenOn: null };
}
