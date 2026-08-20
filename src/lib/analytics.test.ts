import { describe, expect, it } from "vitest";

import {
  PERIOD_KEYS,
  budgetStreak,
  categoryComparison,
  currentMonthSpending,
  expensesInRange,
  monthlyTrend,
  percentChange,
  pickGranularity,
  previousRange,
  rangeLengthInDays,
  resolvePeriod,
  spendingByCategory,
  statsForRange,
  suggestedMonthlyBudget,
  topCategory,
  totalSpending,
  trendSeries,
  type DateRange,
} from "./analytics";
import type { Expense, ExpenseCategory } from "./types";

/* ================================================================== *
 * Fixtures
 *
 * Every expected value below was derived by hand from the doc comments,
 * the function names and a calendar — not by running the code and
 * recording what came back. Where the code disagrees with the derived
 * answer the test still asserts the derived answer and is marked
 * `.fails` (confirmed defect) or `.skip` (the right answer is a
 * judgement call). See ANALYTICS-FINDINGS.md.
 *
 * The suite runs with TZ=Europe/London, enforced by vitest.setup.ts.
 * ================================================================== */

let idCounter = 0;

/** One expense. Only date / amount / category matter to anything under test. */
function expense(
  date: string,
  amount: number,
  category: ExpenseCategory = "Food",
): Expense {
  idCounter += 1;
  return {
    id: `e${idCounter}`,
    date,
    amount,
    category,
    description: `expense ${idCounter}`,
    createdAt: `${date}T09:00:00.000Z`,
  };
}

const range = (start: string, end: string): DateRange => ({ start, end });

/**
 * A fixed local-time reference. Defaults to midday so the reference is
 * unambiguously "that calendar day" under both GMT and BST; the tests that
 * probe the midnight edge pass an explicit hour.
 */
function at(iso: string, hour = 12, minute = 0): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

const keysOf = (points: { key: string }[]) => points.map((p) => p.key);
const totalsOf = (points: { total: number }[]) => points.map((p) => p.total);
/** Sum of every bucket in a trend series (TrendPoint has `total`, not `amount`). */
const charted = (points: { total: number }[]) => points.reduce((sum, p) => sum + p.total, 0);

/* ================================================================== *
 * Simple aggregates
 * ================================================================== */

describe("totalSpending", () => {
  it("sums the amounts of every expense", () => {
    expect(totalSpending([expense("2025-08-01", 10), expense("2025-08-02", 20.5)])).toBe(30.5);
  });

  it("returns 0 for an empty list rather than NaN", () => {
    expect(totalSpending([])).toBe(0);
  });

  it("returns the amount itself for a single expense", () => {
    expect(totalSpending([expense("2025-08-01", 42.75)])).toBe(42.75);
  });

  it("returns 0 when every amount is 0", () => {
    expect(totalSpending([expense("2025-08-01", 0), expense("2025-08-02", 0)])).toBe(0);
  });

  it("counts future-dated expenses like any other", () => {
    // No range parameter, so there is nothing to exclude a 2099 date.
    expect(totalSpending([expense("2099-01-01", 5), expense("2025-08-01", 5)])).toBe(10);
  });
});

describe("currentMonthSpending", () => {
  const spread = [
    expense("2025-05-31", 999, "Bills"), // previous month
    expense("2025-06-01", 100),
    expense("2025-06-30", 50),
    expense("2025-07-01", 7), // next month
    expense("2024-06-15", 500), // same month, wrong year
  ];

  it("totals only expenses in the reference month", () => {
    expect(currentMonthSpending(spread, at("2025-06-15"))).toBe(150);
  });

  it("does not match the same month in a different year", () => {
    expect(currentMonthSpending([expense("2024-06-15", 500)], at("2025-06-15"))).toBe(0);
  });

  it("returns 0 when there are no expenses", () => {
    expect(currentMonthSpending([], at("2025-06-15"))).toBe(0);
  });

  it("includes expenses dated later in the reference month", () => {
    // "Current month", not "month to date": there is no upper bound at the
    // reference day, so a bill already logged for the 28th counts on the 1st.
    expect(currentMonthSpending([expense("2025-06-28", 80)], at("2025-06-01"))).toBe(80);
  });

  it("resolves the month correctly at 00:30 on 1 January, when London is on GMT", () => {
    // Local time equals UTC in winter, so nothing can shift. This is the
    // control for the BST case below.
    expect(currentMonthSpending([expense("2025-01-05", 60)], at("2025-01-01", 0, 30))).toBe(60);
  });

  it("resolves the month correctly at 00:30 on 1 July, when London is on BST", () => {
    // 1 July 2025 00:30 BST is 30 June 23:30 UTC. Deriving the month key from
    // `toISOString()` reads June and bills July's spending to June; `toISO`
    // reads the local calendar day.
    expect(currentMonthSpending(spread, at("2025-07-01", 0, 30))).toBe(7);
  });

  it("agrees with resolvePeriod('thisMonth') about which month it is", () => {
    // Two functions in the same module answering the same question. At 00:30
    // BST on the 1st, resolvePeriod says July (it reads local calendar fields)
    // and currentMonthSpending says June (it reads UTC).
    const reference = at("2025-07-01", 0, 30);
    expect(currentMonthSpending(spread, reference)).toBe(
      totalSpending(expensesInRange(spread, resolvePeriod("thisMonth", spread, reference))),
    );
  });
});

describe("spendingByCategory", () => {
  const mixed = [
    expense("2025-08-01", 10, "Food"),
    expense("2025-08-02", 30, "Shopping"),
    expense("2025-08-03", 5, "Food"),
    expense("2025-08-04", 20, "Bills"),
  ];

  it("sums each category across all expenses", () => {
    expect(spendingByCategory(mixed)).toEqual([
      { category: "Shopping", total: 30 },
      { category: "Bills", total: 20 },
      { category: "Food", total: 15 },
    ]);
  });

  it("orders categories by total, largest first", () => {
    const totals = spendingByCategory(mixed).map((c) => c.total);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
  });

  it("returns an empty array for no expenses", () => {
    expect(spendingByCategory([])).toEqual([]);
  });

  it("returns a single entry when every expense shares one category", () => {
    const oneCategory = [
      expense("2025-08-01", 10, "Transportation"),
      expense("2025-08-02", 15, "Transportation"),
    ];
    expect(spendingByCategory(oneCategory)).toEqual([{ category: "Transportation", total: 25 }]);
  });

  it("keeps a category whose expenses all have zero amounts", () => {
    // The category was used, so it belongs in the breakdown at 0 rather than
    // vanishing — the UI needs to be able to say "you logged this, it cost nothing".
    expect(spendingByCategory([expense("2025-08-01", 0, "Other")])).toEqual([
      { category: "Other", total: 0 },
    ]);
  });

  it("keeps tied categories separate instead of merging them", () => {
    const tied = [expense("2025-08-01", 25, "Food"), expense("2025-08-02", 25, "Bills")];
    expect(spendingByCategory(tied)).toHaveLength(2);
  });
});

describe("topCategory", () => {
  it("returns the category with the largest total, not the largest single expense", () => {
    const expenses = [
      expense("2025-08-01", 10, "Food"),
      expense("2025-08-02", 30, "Shopping"),
      expense("2025-08-03", 25, "Food"),
    ];
    // Food totals 35 across two expenses and beats Shopping's single 30.
    expect(topCategory(expenses)).toEqual({ category: "Food", total: 35 });
  });

  it("returns null when there are no expenses", () => {
    expect(topCategory([])).toBeNull();
  });

  it("returns the only category when there is a single expense", () => {
    expect(topCategory([expense("2025-08-01", 9, "Bills")])).toEqual({
      category: "Bills",
      total: 9,
    });
  });

  it("returns a zero-total category rather than null when all amounts are 0", () => {
    // null means "no data at all"; a logged zero-cost expense is data.
    expect(topCategory([expense("2025-08-01", 0, "Other")])).toEqual({
      category: "Other",
      total: 0,
    });
  });
});

describe("monthlyTrend", () => {
  // Driven by an explicit reference like every other date-dependent export;
  // no fake timers anywhere in this suite.
  const may2025 = at("2025-05-15");

  it("emits six months by default, oldest first, ending with the reference month", () => {
    expect(monthlyTrend([], 6, may2025).map((m) => m.month)).toEqual([
      "2024-12",
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
    ]);
  });

  it("derives the window from the reference, not from the system clock", () => {
    const fromJanuary = monthlyTrend([], 3, at("2025-01-20")).map((m) => m.month);
    const fromMay = monthlyTrend([], 3, may2025).map((m) => m.month);
    expect(fromJanuary).toEqual(["2024-11", "2024-12", "2025-01"]);
    expect(fromMay).toEqual(["2025-03", "2025-04", "2025-05"]);
  });

  it("honours monthsBack", () => {
    expect(monthlyTrend([], 3, may2025).map((m) => m.month)).toEqual([
      "2025-03",
      "2025-04",
      "2025-05",
    ]);
  });

  it("emits only the reference month when monthsBack is 1", () => {
    expect(monthlyTrend([], 1, may2025).map((m) => m.month)).toEqual(["2025-05"]);
  });

  it("emits every month at 0 when there are no expenses", () => {
    expect(totalsOf(monthlyTrend([], 6, may2025))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("sums each expense into its own month", () => {
    const expenses = [
      expense("2025-03-10", 100),
      expense("2025-03-20", 50),
      expense("2025-05-01", 7),
    ];
    expect(totalsOf(monthlyTrend(expenses, 6, may2025))).toEqual([0, 0, 0, 150, 0, 7]);
  });

  it("ignores expenses older than the window", () => {
    expect(totalsOf(monthlyTrend([expense("2024-11-30", 999)], 6, may2025))).toEqual([
      0, 0, 0, 0, 0, 0,
    ]);
  });

  it("ignores expenses dated after the reference month", () => {
    expect(totalsOf(monthlyTrend([expense("2025-06-01", 999)], 6, may2025))).toEqual([
      0, 0, 0, 0, 0, 0,
    ]);
  });

  it("crosses the year boundary when the window reaches back into last year", () => {
    expect(totalsOf(monthlyTrend([expense("2024-12-25", 40)], 6, may2025))).toEqual([
      40, 0, 0, 0, 0, 0,
    ]);
  });

  it("labels months as short month and two-digit year, as MonthlyTotal documents", () => {
    expect(monthlyTrend([], 3, may2025).map((m) => m.label)).toEqual(["Mar 25", "Apr 25", "May 25"]);
  });
});

/* ================================================================== *
 * Range arithmetic
 * ================================================================== */

describe("rangeLengthInDays", () => {
  it("counts a single day as 1, because both bounds are inclusive", () => {
    expect(rangeLengthInDays(range("2025-08-19", "2025-08-19"))).toBe(1);
  });

  it("counts a full 31-day calendar month as 31", () => {
    expect(rangeLengthInDays(range("2025-01-01", "2025-01-31"))).toBe(31);
  });

  it("counts a 28-day February as 28", () => {
    expect(rangeLengthInDays(range("2025-02-01", "2025-02-28"))).toBe(28);
  });

  it("counts a leap February as 29", () => {
    expect(rangeLengthInDays(range("2024-02-01", "2024-02-29"))).toBe(29);
  });

  it("counts 365 days across a non-leap year", () => {
    // The 23-hour and 25-hour days inside 2025 cancel out exactly.
    expect(rangeLengthInDays(range("2025-01-01", "2025-12-31"))).toBe(365);
  });

  it("counts 366 days across a leap year", () => {
    expect(rangeLengthInDays(range("2024-01-01", "2024-12-31"))).toBe(366);
  });

  it("stays correct across the 23-hour day when the clocks go forward (30 Mar 2025)", () => {
    // 29th to 31st spans the transition: 23h + 24h = 47h, which must round to 2
    // whole days and therefore 3 inclusive days.
    expect(rangeLengthInDays(range("2025-03-29", "2025-03-31"))).toBe(3);
  });

  it("counts March 2025 as 31 days despite the lost hour", () => {
    expect(rangeLengthInDays(range("2025-03-01", "2025-03-31"))).toBe(31);
  });

  it("stays correct across the 25-hour day when the clocks go back (26 Oct 2025)", () => {
    // 25th to 27th spans the transition: 25h + 24h = 49h.
    expect(rangeLengthInDays(range("2025-10-25", "2025-10-27"))).toBe(3);
  });

  it("counts October 2025 as 31 days despite the repeated hour", () => {
    expect(rangeLengthInDays(range("2025-10-01", "2025-10-31"))).toBe(31);
  });

  it("counts a range spanning both UK transitions correctly", () => {
    // 30 Mar 2025 to 26 Oct 2025 is 210 days apart, 211 inclusive. The lost
    // hour in March and the gained hour in October cancel.
    expect(rangeLengthInDays(range("2025-03-30", "2025-10-26"))).toBe(211);
  });

  it("counts a single BST day and a single GMT day identically", () => {
    expect(rangeLengthInDays(range("2025-03-30", "2025-03-30"))).toBe(1);
    expect(rangeLengthInDays(range("2025-10-26", "2025-10-26"))).toBe(1);
  });

  it("reports an inverted range as 0 days, never a negative count", () => {
    // An inclusive day count is a size. A negative one used to propagate into
    // previousRange and produce a range that ran backwards.
    expect(rangeLengthInDays(range("2025-01-10", "2025-01-05"))).toBe(0);
  });
});

describe("resolvePeriod", () => {
  const sample = [expense("2024-06-01", 10), expense("2025-07-04", 20)];

  it.each([...PERIOD_KEYS])("%s returns ISO YYYY-MM-DD bounds", (period) => {
    const resolved = resolvePeriod(period, sample, at("2024-02-29"));
    expect(resolved.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resolved.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each([...PERIOD_KEYS])("%s returns a range whose start is not after its end", (period) => {
    const resolved = resolvePeriod(period, sample, at("2024-02-29"));
    expect(resolved.start <= resolved.end).toBe(true);
  });

  describe("thisMonth", () => {
    it("runs from the 1st to the reference day, i.e. month to date", () => {
      // A dashboard "this month" figure should not include the rest of the
      // month that has not happened yet.
      expect(resolvePeriod("thisMonth", [], at("2025-08-19"))).toEqual(
        range("2025-08-01", "2025-08-19"),
      );
    });

    it("is a single day when the reference is the 1st", () => {
      expect(resolvePeriod("thisMonth", [], at("2025-08-01"))).toEqual(
        range("2025-08-01", "2025-08-01"),
      );
    });

    it("covers the whole month when the reference is the 31st", () => {
      expect(resolvePeriod("thisMonth", [], at("2025-01-31"))).toEqual(
        range("2025-01-01", "2025-01-31"),
      );
    });

    it("covers 29 days when the reference is 29 February in a leap year", () => {
      const resolved = resolvePeriod("thisMonth", [], at("2024-02-29"));
      expect(resolved).toEqual(range("2024-02-01", "2024-02-29"));
      expect(rangeLengthInDays(resolved)).toBe(29);
    });

    it("is a single day on 1 January", () => {
      expect(resolvePeriod("thisMonth", [], at("2025-01-01"))).toEqual(
        range("2025-01-01", "2025-01-01"),
      );
    });
  });

  describe("lastMonth", () => {
    it("returns the full calendar month, not the last 30 days", () => {
      const resolved = resolvePeriod("lastMonth", [], at("2025-03-15"));
      expect(resolved).toEqual(range("2025-02-01", "2025-02-28"));
      expect(rangeLengthInDays(resolved)).toBe(28);
    });

    it("returns a full 28-day February", () => {
      expect(rangeLengthInDays(resolvePeriod("lastMonth", [], at("2025-03-10")))).toBe(28);
    });

    it("returns a full 30-day April", () => {
      const resolved = resolvePeriod("lastMonth", [], at("2025-05-10"));
      expect(resolved).toEqual(range("2025-04-01", "2025-04-30"));
      expect(rangeLengthInDays(resolved)).toBe(30);
    });

    it("returns a full 31-day March", () => {
      const resolved = resolvePeriod("lastMonth", [], at("2025-04-10"));
      expect(resolved).toEqual(range("2025-03-01", "2025-03-31"));
      expect(rangeLengthInDays(resolved)).toBe(31);
    });

    it("returns a 29-day February in a leap year", () => {
      const resolved = resolvePeriod("lastMonth", [], at("2024-03-15"));
      expect(resolved).toEqual(range("2024-02-01", "2024-02-29"));
      expect(rangeLengthInDays(resolved)).toBe(29);
    });

    it("does not let a 31st reference day leak into a shorter previous month", () => {
      // The classic JS date bug: 31 March minus one month overflows to 2 or 3
      // March. Building from day 1 and day 0 avoids it.
      expect(resolvePeriod("lastMonth", [], at("2024-03-31"))).toEqual(
        range("2024-02-01", "2024-02-29"),
      );
      expect(resolvePeriod("lastMonth", [], at("2025-05-31"))).toEqual(
        range("2025-04-01", "2025-04-30"),
      );
    });

    it("crosses into the previous year on 1 January", () => {
      expect(resolvePeriod("lastMonth", [], at("2025-01-01"))).toEqual(
        range("2024-12-01", "2024-12-31"),
      );
    });

    it("returns January when the reference is 29 February", () => {
      expect(resolvePeriod("lastMonth", [], at("2024-02-29"))).toEqual(
        range("2024-01-01", "2024-01-31"),
      );
    });
  });

  describe("last3Months", () => {
    it("starts on the 1st of the month two months back and ends today", () => {
      expect(resolvePeriod("last3Months", [], at("2025-08-19"))).toEqual(
        range("2025-06-01", "2025-08-19"),
      );
    });

    it("crosses the year boundary from a January reference", () => {
      expect(resolvePeriod("last3Months", [], at("2025-01-31"))).toEqual(
        range("2024-11-01", "2025-01-31"),
      );
    });

    it("handles a 29 February reference", () => {
      expect(resolvePeriod("last3Months", [], at("2024-02-29"))).toEqual(
        range("2023-12-01", "2024-02-29"),
      );
    });

    it("is a partial window on 1 January, not three whole months", () => {
      expect(resolvePeriod("last3Months", [], at("2025-01-01"))).toEqual(
        range("2024-11-01", "2025-01-01"),
      );
    });
  });

  describe("last6Months", () => {
    it("starts on the 1st of the month five months back and ends today", () => {
      expect(resolvePeriod("last6Months", [], at("2025-08-19"))).toEqual(
        range("2025-03-01", "2025-08-19"),
      );
    });

    it("crosses the year boundary from a January reference", () => {
      expect(resolvePeriod("last6Months", [], at("2025-01-01"))).toEqual(
        range("2024-08-01", "2025-01-01"),
      );
    });

    it("handles a 29 February reference", () => {
      expect(resolvePeriod("last6Months", [], at("2024-02-29"))).toEqual(
        range("2023-09-01", "2024-02-29"),
      );
    });
  });

  describe("yearToDate", () => {
    it("runs from 1 January to the reference day", () => {
      expect(resolvePeriod("yearToDate", [], at("2025-08-19"))).toEqual(
        range("2025-01-01", "2025-08-19"),
      );
    });

    it("is a single day on 1 January", () => {
      const resolved = resolvePeriod("yearToDate", [], at("2025-01-01"));
      expect(resolved).toEqual(range("2025-01-01", "2025-01-01"));
      expect(rangeLengthInDays(resolved)).toBe(1);
    });

    it("covers the whole year on 31 December", () => {
      expect(rangeLengthInDays(resolvePeriod("yearToDate", [], at("2025-12-31")))).toBe(365);
    });

    it("covers 60 days on 29 February in a leap year", () => {
      // 31 days of January plus 29 of February.
      expect(rangeLengthInDays(resolvePeriod("yearToDate", [], at("2024-02-29")))).toBe(60);
    });
  });

  describe("allTime", () => {
    it("collapses to a single day at the reference when there are no expenses", () => {
      expect(resolvePeriod("allTime", [], at("2025-08-19"))).toEqual(
        range("2025-08-19", "2025-08-19"),
      );
    });

    it("starts at the earliest expense and ends today when everything is in the past", () => {
      const expenses = [expense("2025-01-02", 10), expense("2024-03-05", 10)];
      expect(resolvePeriod("allTime", expenses, at("2025-08-19"))).toEqual(
        range("2024-03-05", "2025-08-19"),
      );
    });

    it("finds the earliest and latest dates regardless of array order", () => {
      const expenses = [
        expense("2025-05-05", 10),
        expense("2023-01-31", 10),
        expense("2024-09-09", 10),
      ];
      expect(resolvePeriod("allTime", expenses, at("2025-08-19")).start).toBe("2023-01-31");
    });

    it("extends the end past today to include future-dated expenses", () => {
      // Unlike thisMonth / yearToDate, "all time" has to cover everything on
      // record or those expenses would be unreachable from every period.
      const expenses = [expense("2025-01-02", 10), expense("2026-03-01", 10)];
      expect(resolvePeriod("allTime", expenses, at("2025-08-19")).end).toBe("2026-03-01");
    });

    it("is a single day when there is exactly one expense dated today", () => {
      expect(resolvePeriod("allTime", [expense("2025-08-19", 10)], at("2025-08-19"))).toEqual(
        range("2025-08-19", "2025-08-19"),
      );
    });
  });
});

describe("previousRange", () => {
  /*
   * Intended contract.
   *
   * previousRange supplies the baseline behind the dashboard's "vs previous
   * period" comparison, so the range it returns has to be the thing a user
   * would name when asked "compared to what?".
   *
   *   - A range starting on the 1st of a month is month-aligned, so it steps
   *     back by whole months and keeps its day-of-month footprint: February
   *     against the whole of January, 1–19 August against 1–19 July.
   *   - Anything else gets the N days immediately before it.
   *
   * The two ranges are therefore not always the same length, and that is
   * correct: "February vs January" compares 28 days against 31.
   *
   * The alignment matters because recurring charges land at the start of a
   * month. The original equal-length rule returned 4–31 January for February,
   * excluding rent from the baseline while February still counted it — a
   * one-directional bias big enough to report "up 6%" for a month that was
   * actually down 10%. See ANALYTICS-FINDINGS.md (F2).
   */

  describe("month-aligned ranges", () => {
    it("returns the whole previous calendar month for a 28-day February", () => {
      expect(previousRange(range("2025-02-01", "2025-02-28"))).toEqual(
        range("2025-01-01", "2025-01-31"),
      );
    });

    it("returns the whole previous calendar month for a 31-day March", () => {
      expect(previousRange(range("2025-03-01", "2025-03-31"))).toEqual(
        range("2025-02-01", "2025-02-28"),
      );
    });

    it("returns the whole previous calendar month for a 30-day April", () => {
      expect(previousRange(range("2025-04-01", "2025-04-30"))).toEqual(
        range("2025-03-01", "2025-03-31"),
      );
    });

    it("crosses the year boundary for January", () => {
      expect(previousRange(range("2025-01-01", "2025-01-31"))).toEqual(
        range("2024-12-01", "2024-12-31"),
      );
    });

    it("returns a full 31-day January for a 29-day leap February", () => {
      expect(previousRange(range("2024-02-01", "2024-02-29"))).toEqual(
        range("2024-01-01", "2024-01-31"),
      );
    });

    it("keeps the 1st of the previous month in the baseline", () => {
      // The whole point of the alignment. Rent and standing orders land on the
      // 1st; a window that starts on the 4th drops them from the baseline while
      // the current period still counts them, which biases every comparison the
      // same way and can flip the sign of the reported change.
      expect(previousRange(range("2025-02-01", "2025-02-28")).start).toBe("2025-01-01");
    });

    it("allows the two ranges to differ in length, because months do", () => {
      const february = range("2025-02-01", "2025-02-28");
      const january = previousRange(february);
      expect(rangeLengthInDays(february)).toBe(28);
      expect(rangeLengthInDays(january)).toBe(31);
    });

    it("holds the day of the month for a month-to-date range", () => {
      expect(previousRange(range("2025-08-01", "2025-08-19"))).toEqual(
        range("2025-07-01", "2025-07-19"),
      );
    });

    it("compares the 1st against the 1st for a single-day month-to-date range", () => {
      expect(previousRange(range("2025-08-01", "2025-08-01"))).toEqual(
        range("2025-07-01", "2025-07-01"),
      );
    });

    it("clamps the day of the month when the previous month is shorter", () => {
      // There is no 30 February, so 1–30 March compares against all of February.
      expect(previousRange(range("2025-03-01", "2025-03-30"))).toEqual(
        range("2025-02-01", "2025-02-28"),
      );
    });

    it("treats month-to-date on the last day of the month as a whole month", () => {
      // On 31 March, "this month" and "last month" describe the same span, and
      // the right baseline for a complete March is a complete February.
      expect(previousRange(range("2025-03-01", "2025-03-31"))).toEqual(
        range("2025-02-01", "2025-02-28"),
      );
    });

    it("steps back three months for a three-month range", () => {
      expect(previousRange(range("2025-06-01", "2025-08-19"))).toEqual(
        range("2025-03-01", "2025-05-19"),
      );
    });

    it("steps back six months for a six-month range", () => {
      expect(previousRange(range("2025-03-01", "2025-08-19"))).toEqual(
        range("2024-09-01", "2025-02-19"),
      );
    });

    it("steps back a whole year for a full calendar year", () => {
      expect(previousRange(range("2025-01-01", "2025-12-31"))).toEqual(
        range("2024-01-01", "2024-12-31"),
      );
    });

    it("steps back by the span for a year-to-date range", () => {
      // 1 Jan – 19 Aug spans eight months, so the preceding period is the eight
      // months before it: 1 May – 19 Dec 2024.
      expect(previousRange(range("2025-01-01", "2025-08-19"))).toEqual(
        range("2024-05-01", "2024-12-19"),
      );
    });
  });

  describe("paired with resolvePeriod, as the dashboard does", () => {
    it("compares lastMonth against the month before it", () => {
      const lastMonth = resolvePeriod("lastMonth", [], at("2025-03-15"));
      expect(previousRange(lastMonth)).toEqual(range("2025-01-01", "2025-01-31"));
    });

    it("compares thisMonth against the same days of the previous month", () => {
      const thisMonth = resolvePeriod("thisMonth", [], at("2025-08-19"));
      expect(previousRange(thisMonth)).toEqual(range("2025-07-01", "2025-07-19"));
    });

    it.each(["thisMonth", "lastMonth", "last3Months", "last6Months", "yearToDate"] as const)(
      "%s produces a baseline that ends strictly before the period starts",
      (period) => {
        const current = resolvePeriod(period, [], at("2025-08-19"));
        const baseline = previousRange(current);
        expect(baseline.end < current.start).toBe(true);
        expect(baseline.start <= baseline.end).toBe(true);
      },
    );
  });

  describe("ranges that are not month-aligned", () => {
    it("falls back to the equally-long window ending the day before", () => {
      const input = range("2025-08-05", "2025-08-19");
      const previous = previousRange(input);
      expect(previous).toEqual(range("2025-07-21", "2025-08-04"));
      expect(rangeLengthInDays(previous)).toBe(rangeLengthInDays(input));
    });

    it("returns the previous single day for a one-day range", () => {
      expect(previousRange(range("2025-08-19", "2025-08-19"))).toEqual(
        range("2025-08-18", "2025-08-18"),
      );
    });

    it("keeps the length correct when the previous range contains the 23-hour day", () => {
      const previous = previousRange(range("2025-03-31", "2025-04-06"));
      expect(previous).toEqual(range("2025-03-24", "2025-03-30"));
      expect(rangeLengthInDays(previous)).toBe(7);
    });

    it("keeps the length correct when the previous range contains the 25-hour day", () => {
      const previous = previousRange(range("2025-10-27", "2025-11-02"));
      expect(previous).toEqual(range("2025-10-20", "2025-10-26"));
      expect(rangeLengthInDays(previous)).toBe(7);
    });

    it("does not produce a backwards range from a backwards input", () => {
      const previous = previousRange(range("2025-01-10", "2025-01-05"));
      expect(previous.start <= previous.end).toBe(true);
      expect(previous).toEqual(range("2025-01-09", "2025-01-09"));
    });

    it("does not take the month-aligned path for a backwards range starting on the 1st", () => {
      const previous = previousRange(range("2025-08-01", "2025-07-15"));
      expect(previous.start <= previous.end).toBe(true);
    });
  });
});

describe("expensesInRange", () => {
  const expenses = [
    expense("2025-07-31", 1),
    expense("2025-08-01", 2),
    expense("2025-08-15", 3),
    expense("2025-08-31", 4),
    expense("2025-09-01", 5),
  ];
  const august = range("2025-08-01", "2025-08-31");

  it("includes expenses dated exactly on the start and end bounds", () => {
    expect(totalSpending(expensesInRange(expenses, august))).toBe(9);
  });

  it("excludes the day before the start and the day after the end", () => {
    const dates = expensesInRange(expenses, august).map((e) => e.date);
    expect(dates).not.toContain("2025-07-31");
    expect(dates).not.toContain("2025-09-01");
  });

  it("preserves the input order", () => {
    expect(expensesInRange(expenses, august).map((e) => e.date)).toEqual([
      "2025-08-01",
      "2025-08-15",
      "2025-08-31",
    ]);
  });

  it("returns an empty array when nothing falls in the range", () => {
    expect(expensesInRange(expenses, range("2025-12-01", "2025-12-31"))).toEqual([]);
  });

  it("returns an empty array for an empty expense list", () => {
    expect(expensesInRange([], august)).toEqual([]);
  });

  it("matches only that day for a one-day range", () => {
    expect(expensesInRange(expenses, range("2025-08-15", "2025-08-15"))).toHaveLength(1);
  });

  it("excludes future-dated expenses that fall outside the range", () => {
    expect(expensesInRange([expense("2099-01-01", 10)], august)).toEqual([]);
  });

  it("is unaffected by DST, because it compares ISO strings not instants", () => {
    const across = [expense("2025-03-30", 10), expense("2025-10-26", 20)];
    expect(expensesInRange(across, range("2025-03-30", "2025-03-30"))).toHaveLength(1);
    expect(expensesInRange(across, range("2025-10-26", "2025-10-26"))).toHaveLength(1);
  });

  it("returns nothing for a backwards range", () => {
    expect(expensesInRange(expenses, range("2025-08-31", "2025-08-01"))).toEqual([]);
  });
});

/* ================================================================== *
 * Statistics
 * ================================================================== */

describe("statsForRange", () => {
  /*
   * Contract between the two parameters.
   *
   * statsForRange takes `(expenses, range)` and applies `range` to `expenses`,
   * matching its neighbour trendSeries, which has the same-shaped signature.
   *
   * It used to read `range` only for the averagePerDay divisor and take
   * `expenses` verbatim, which made "already narrowed by the caller" an
   * unwritten, unchecked precondition — and the opposite convention to
   * trendSeries, three lines away in AnalyticsDashboard.tsx. Passing the full
   * list and passing a pre-filtered one now agree, so the trap is gone.
   */

  const inRange = [
    expense("2025-01-02", 100, "Food"),
    expense("2025-01-05", 200, "Shopping"),
    expense("2025-01-09", 300, "Food"),
  ];
  const tenDays = range("2025-01-01", "2025-01-10");

  it("totals and counts the expenses it is given", () => {
    const stats = statsForRange(inRange, tenDays);
    expect(stats.total).toBe(600);
    expect(stats.count).toBe(3);
  });

  it("divides the total by the inclusive day count for averagePerDay", () => {
    expect(statsForRange(inRange, tenDays).averagePerDay).toBe(60);
  });

  it("divides the total by the transaction count for averageTransaction", () => {
    expect(statsForRange(inRange, tenDays).averageTransaction).toBe(200);
  });

  it("reports the largest category in the set", () => {
    expect(statsForRange(inRange, tenDays).top).toEqual({ category: "Food", total: 400 });
  });

  it("treats a one-day range as one day, not zero", () => {
    expect(statsForRange([expense("2025-01-01", 50)], range("2025-01-01", "2025-01-01"))).toEqual({
      total: 50,
      count: 1,
      averagePerDay: 50,
      averageTransaction: 50,
      top: { category: "Food", total: 50 },
    });
  });

  it("uses the DST-corrected day count, so March averages over 31 days", () => {
    const march = statsForRange([expense("2025-03-15", 310)], range("2025-03-01", "2025-03-31"));
    expect(march.averagePerDay).toBeCloseTo(10, 10);
  });

  it("returns zeroes rather than NaN when there are no expenses", () => {
    expect(statsForRange([], tenDays)).toEqual({
      total: 0,
      count: 0,
      averagePerDay: 0,
      averageTransaction: 0,
      top: null,
    });
  });

  it("keeps both averages finite when there are no expenses", () => {
    const stats = statsForRange([], tenDays);
    expect(Number.isFinite(stats.averagePerDay)).toBe(true);
    expect(Number.isFinite(stats.averageTransaction)).toBe(true);
  });

  it("keeps averagePerDay finite and non-negative for a backwards range", () => {
    // rangeLengthInDays goes negative here; the Math.max(1, …) clamp is what
    // stops that becoming a negative or infinite average.
    const stats = statsForRange(inRange, range("2025-01-10", "2025-01-01"));
    expect(Number.isFinite(stats.averagePerDay)).toBe(true);
    expect(stats.averagePerDay).toBeGreaterThanOrEqual(0);
  });

  it("reports zero averages when every amount is 0", () => {
    const free = [expense("2025-01-02", 0), expense("2025-01-03", 0)];
    const stats = statsForRange(free, tenDays);
    expect(stats.averagePerDay).toBe(0);
    expect(stats.averageTransaction).toBe(0);
  });

  it("counts only the expenses that fall inside the range", () => {
    // The signature accepts a range, so the range is applied. Previously the
    // February expense was counted in full while averagePerDay still divided
    // by January's 31 days.
    const all = [expense("2025-01-02", 100), expense("2025-02-02", 200)];
    const stats = statsForRange(all, range("2025-01-01", "2025-01-31"));
    expect(stats.total).toBe(100);
    expect(stats.count).toBe(1);
    expect(stats.averagePerDay).toBeCloseTo(100 / 31, 10);
  });

  it("gives the same answer for a pre-filtered list as for the full list", () => {
    // The precondition the old signature carried silently is now a no-op:
    // filtering twice is the same as filtering once.
    const all = [expense("2025-01-02", 100), expense("2025-02-02", 200)];
    const january = range("2025-01-01", "2025-01-31");
    expect(statsForRange(all, january)).toEqual(
      statsForRange(expensesInRange(all, january), january),
    );
  });

  it("picks the top category from inside the range only", () => {
    const all = [
      expense("2025-01-02", 10, "Food"),
      expense("2025-02-02", 1000, "Shopping"),
    ];
    expect(statsForRange(all, range("2025-01-01", "2025-01-31")).top).toEqual({
      category: "Food",
      total: 10,
    });
  });

  it("agrees with trendSeries given the same arguments", () => {
    // Same (expenses, range) pair into two sibling functions should describe
    // the same money. trendSeries filters; statsForRange does not.
    const all = [expense("2025-01-02", 100), expense("2025-02-02", 200)];
    const january = range("2025-01-01", "2025-01-31");
    const charted = trendSeries(all, january).reduce((sum, p) => sum + p.total, 0);
    expect(statsForRange(all, january).total).toBe(charted);
  });
});

describe("percentChange", () => {
  it("reports a rise as a positive fraction", () => {
    expect(percentChange(150, 100)).toBe(0.5);
  });

  it("reports a fall as a negative fraction", () => {
    expect(percentChange(50, 100)).toBe(-0.5);
  });

  it("reports no change as 0", () => {
    expect(percentChange(100, 100)).toBe(0);
  });

  it("reports a drop to nothing as -1", () => {
    expect(percentChange(0, 100)).toBe(-1);
  });

  it("returns null when the previous value is 0, rather than Infinity", () => {
    // Documented: callers render "no prior data" instead of a meaningless
    // +100% for a category that is new this period.
    expect(percentChange(500, 0)).toBeNull();
  });

  it("returns null when both values are 0", () => {
    expect(percentChange(0, 0)).toBeNull();
  });

  it("handles fractional currency amounts", () => {
    expect(percentChange(33.33, 11.11)).toBeCloseTo(2, 10);
  });
});

describe("categoryComparison", () => {
  const current = [
    expense("2025-08-01", 100, "Food"),
    expense("2025-08-02", 50, "Shopping"),
  ];
  const previous = [
    expense("2025-07-01", 80, "Food"),
    expense("2025-07-02", 500, "Bills"),
  ];

  it("orders categories by current spend, largest first, with dropped ones last", () => {
    // Bills has no current spend, so it sorts to the bottom on total 0 — still
    // present, but never crowding out what the user is spending on now.
    expect(categoryComparison(current, previous).map((c) => c.category)).toEqual([
      "Food",
      "Shopping",
      "Bills",
    ]);
  });

  it("pairs each category with its own total from the previous period", () => {
    const food = categoryComparison(current, previous)[0];
    expect(food.total).toBe(100);
    expect(food.previousTotal).toBe(80);
    expect(food.change).toBeCloseTo(0.25, 10);
  });

  it("expresses share as a fraction of the current period total", () => {
    const [food, shopping] = categoryComparison(current, previous);
    expect(food.share).toBeCloseTo(100 / 150, 10);
    expect(shopping.share).toBeCloseTo(50 / 150, 10);
  });

  it("has shares summing to 1", () => {
    const sum = categoryComparison(current, previous).reduce((acc, c) => acc + c.share, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("reports change as null for a category that is new this period", () => {
    expect(categoryComparison(current, previous)[1].change).toBeNull();
  });

  it("returns an empty array when neither period has expenses", () => {
    expect(categoryComparison([], [])).toEqual([]);
  });

  it("still reports what was spent before when the current period is empty", () => {
    // Every entry comes back at 0 against its previous total. CategoryBreakdown
    // treats an all-zero result as its empty state, so the UI is unchanged.
    const compared = categoryComparison([], previous);
    expect(compared.map((c) => c.category).sort()).toEqual(["Bills", "Food"]);
    expect(compared.every((c) => c.total === 0 && c.change === -1)).toBe(true);
  });

  it("gives every category a share of 0 when the grand total is 0", () => {
    // Guarding this is what stops the UI rendering NaN% on a zero-cost month.
    const free = [expense("2025-08-01", 0, "Food"), expense("2025-08-02", 0, "Bills")];
    for (const entry of categoryComparison(free, [])) {
      expect(entry.share).toBe(0);
    }
  });

  it("works with no previous period at all", () => {
    const compared = categoryComparison(current, []);
    expect(compared.map((c) => c.previousTotal)).toEqual([0, 0]);
    expect(compared.map((c) => c.change)).toEqual([null, null]);
  });

  it("includes a category that was spent on before but not this period", () => {
    // Bills went from £500 to £0 — the single biggest change in the comparison.
    // Building the result from the current period's categories alone used to
    // drop it entirely.
    expect(categoryComparison(current, previous)).toContainEqual({
      category: "Bills",
      total: 0,
      previousTotal: 500,
      share: 0,
      change: -1,
    });
  });

  it("compares every category present in either period", () => {
    expect(categoryComparison(current, previous)).toHaveLength(3);
  });

  it("gives a dropped category a share of 0, not a share of the previous total", () => {
    const bills = categoryComparison(current, previous).find((c) => c.category === "Bills");
    expect(bills?.share).toBe(0);
  });
});

/* ================================================================== *
 * Charting
 * ================================================================== */

describe("pickGranularity", () => {
  it("uses daily buckets for a single day", () => {
    expect(pickGranularity(range("2025-08-19", "2025-08-19"))).toBe("day");
  });

  it("uses daily buckets at exactly 31 days", () => {
    const thirtyOne = range("2025-01-01", "2025-01-31");
    expect(rangeLengthInDays(thirtyOne)).toBe(31);
    expect(pickGranularity(thirtyOne)).toBe("day");
  });

  it("steps up to weekly buckets at exactly 32 days", () => {
    const thirtyTwo = range("2025-01-01", "2025-02-01");
    expect(rangeLengthInDays(thirtyTwo)).toBe(32);
    expect(pickGranularity(thirtyTwo)).toBe("week");
  });

  it("still uses weekly buckets at exactly 120 days", () => {
    // 31 + 28 + 31 + 30. Also spans the 30 March transition, so this doubles
    // as proof that the lost hour does not shift the threshold.
    const oneTwenty = range("2025-01-01", "2025-04-30");
    expect(rangeLengthInDays(oneTwenty)).toBe(120);
    expect(pickGranularity(oneTwenty)).toBe("week");
  });

  it("steps up to monthly buckets at exactly 121 days", () => {
    const oneTwentyOne = range("2025-01-01", "2025-05-01");
    expect(rangeLengthInDays(oneTwentyOne)).toBe(121);
    expect(pickGranularity(oneTwentyOne)).toBe("month");
  });

  it("uses monthly buckets for a full year", () => {
    expect(pickGranularity(range("2025-01-01", "2025-12-31"))).toBe("month");
  });
});

describe("trendSeries", () => {
  describe("daily buckets", () => {
    const week = range("2025-08-01", "2025-08-07");

    it("emits one bucket per day, inclusive of both bounds", () => {
      expect(keysOf(trendSeries([], week))).toEqual([
        "2025-08-01",
        "2025-08-02",
        "2025-08-03",
        "2025-08-04",
        "2025-08-05",
        "2025-08-06",
        "2025-08-07",
      ]);
    });

    it("emits empty buckets at 0 so the x-axis stays continuous", () => {
      const points = trendSeries([expense("2025-08-04", 25)], week);
      expect(totalsOf(points)).toEqual([0, 0, 0, 25, 0, 0, 0]);
    });

    it("has no gaps between consecutive bucket keys", () => {
      const keys = keysOf(trendSeries([], range("2025-08-01", "2025-08-31")));
      for (let i = 1; i < keys.length; i += 1) {
        expect(rangeLengthInDays(range(keys[i - 1], keys[i]))).toBe(2);
      }
    });

    it("emits unique keys", () => {
      const keys = keysOf(trendSeries([], range("2025-08-01", "2025-08-31")));
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("sums several expenses landing on the same day", () => {
      const points = trendSeries([expense("2025-08-02", 10), expense("2025-08-02", 5)], week);
      expect(points[1].total).toBe(15);
    });

    it("excludes expenses before the range", () => {
      expect(charted(trendSeries([expense("2025-07-31", 99)], week))).toBe(0);
    });

    it("excludes expenses after the range", () => {
      expect(totalsOf(trendSeries([expense("2025-08-08", 99)], week))).toEqual([
        0, 0, 0, 0, 0, 0, 0,
      ]);
    });

    it("excludes future-dated expenses", () => {
      expect(totalsOf(trendSeries([expense("2099-01-01", 99)], week))).toEqual([
        0, 0, 0, 0, 0, 0, 0,
      ]);
    });

    it("emits a single bucket for a one-day range", () => {
      const points = trendSeries([expense("2025-08-19", 12)], range("2025-08-19", "2025-08-19"));
      expect(points).toEqual([{ key: "2025-08-19", label: "Aug 19", total: 12 }]);
    });

    it("labels buckets as short month and day", () => {
      expect(trendSeries([], week)[0].label).toBe("Aug 1");
    });

    it("preserves the whole in-range total across the buckets", () => {
      const expenses = [
        expense("2025-08-01", 10),
        expense("2025-08-04", 20),
        expense("2025-08-07", 30),
      ];
      expect(charted(trendSeries(expenses, week))).toBe(60);
    });
  });

  describe("daily buckets across the DST transitions", () => {
    it("emits exactly one bucket for the 23-hour day (30 March 2025)", () => {
      expect(keysOf(trendSeries([], range("2025-03-28", "2025-04-01")))).toEqual([
        "2025-03-28",
        "2025-03-29",
        "2025-03-30",
        "2025-03-31",
        "2025-04-01",
      ]);
    });

    it("emits exactly one bucket for the 25-hour day (26 October 2025)", () => {
      expect(keysOf(trendSeries([], range("2025-10-24", "2025-10-28")))).toEqual([
        "2025-10-24",
        "2025-10-25",
        "2025-10-26",
        "2025-10-27",
        "2025-10-28",
      ]);
    });

    it("emits 31 buckets for March 2025, neither skipping nor repeating a day", () => {
      const keys = keysOf(trendSeries([], range("2025-03-01", "2025-03-31")));
      expect(keys).toHaveLength(31);
      expect(new Set(keys).size).toBe(31);
      expect(keys[keys.length - 1]).toBe("2025-03-31");
    });

    it("emits 31 buckets for October 2025", () => {
      const keys = keysOf(trendSeries([], range("2025-10-01", "2025-10-31")));
      expect(keys).toHaveLength(31);
      expect(new Set(keys).size).toBe(31);
    });

    it("puts an expense on the transition day in its own bucket", () => {
      const points = trendSeries(
        [expense("2025-03-30", 40), expense("2025-10-26", 60)],
        range("2025-03-28", "2025-04-01"),
      );
      expect(points.find((p) => p.key === "2025-03-30")?.total).toBe(40);
    });
  });

  describe("weekly buckets", () => {
    // 1 January 2025 is a Wednesday; the Monday of its week is 30 Dec 2024.
    const midWeekStart = range("2025-01-01", "2025-01-14");

    it("anchors the first bucket to the Monday of the week the range starts in", () => {
      // The key deliberately precedes range.start: weeks are Monday-based, so
      // a range starting on a Wednesday opens with a partial week whose label
      // is its Monday.
      expect(keysOf(trendSeries([], midWeekStart, "week"))).toEqual([
        "2024-12-30",
        "2025-01-06",
        "2025-01-13",
      ]);
    });

    it("puts a Sunday into the week that began the previous Monday", () => {
      // The awkward branch in startOfWeek: getDay() === 0 has to go back six
      // days, not forward one.
      const points = trendSeries([expense("2025-01-05", 20)], midWeekStart, "week");
      expect(points[0].total).toBe(20);
    });

    it("starts a new bucket on Monday", () => {
      const points = trendSeries(
        [expense("2025-01-05", 20), expense("2025-01-06", 5)],
        midWeekStart,
        "week",
      );
      expect(totalsOf(points)).toEqual([20, 5, 0]);
    });

    it("puts the final partial week in the last bucket", () => {
      const points = trendSeries([expense("2025-01-14", 7)], midWeekStart, "week");
      expect(points[2].total).toBe(7);
    });

    it("excludes an expense inside the first bucket but before the range starts", () => {
      // 30 Dec 2024 owns the first bucket, but it is outside the requested
      // range, so its spending must not appear.
      expect(charted(trendSeries([expense("2024-12-30", 999)], midWeekStart, "week"))).toBe(0);
    });

    it("emits every week including empty ones", () => {
      expect(totalsOf(trendSeries([], midWeekStart, "week"))).toEqual([0, 0, 0]);
    });

    it("keeps buckets exactly seven days apart across the spring transition", () => {
      expect(keysOf(trendSeries([], range("2025-03-24", "2025-04-06"), "week"))).toEqual([
        "2025-03-24",
        "2025-03-31",
      ]);
    });

    it("keeps buckets exactly seven days apart across the autumn transition", () => {
      expect(keysOf(trendSeries([], range("2025-10-20", "2025-11-02"), "week"))).toEqual([
        "2025-10-20",
        "2025-10-27",
      ]);
    });

    it("is chosen automatically for a 32-day range", () => {
      // 1 Jan is a Wednesday, so the buckets open on Monday 30 December.
      expect(keysOf(trendSeries([], range("2025-01-01", "2025-02-01")))).toEqual([
        "2024-12-30",
        "2025-01-06",
        "2025-01-13",
        "2025-01-20",
        "2025-01-27",
      ]);
    });
  });

  describe("monthly buckets", () => {
    const acrossNewYear = range("2024-11-15", "2025-05-10");

    it("anchors buckets to the 1st and runs continuously across the year boundary", () => {
      expect(keysOf(trendSeries([], acrossNewYear, "month"))).toEqual([
        "2024-11-01",
        "2024-12-01",
        "2025-01-01",
        "2025-02-01",
        "2025-03-01",
        "2025-04-01",
        "2025-05-01",
      ]);
    });

    it("is chosen automatically for a range longer than 120 days", () => {
      expect(trendSeries([], acrossNewYear)).toHaveLength(7);
    });

    it("labels buckets as short month and two-digit year", () => {
      expect(trendSeries([], acrossNewYear, "month")[0].label).toBe("Nov 24");
    });

    it("sums a whole month into one bucket", () => {
      const points = trendSeries(
        [expense("2025-01-02", 10), expense("2025-01-31", 15)],
        acrossNewYear,
        "month",
      );
      expect(points.find((p) => p.key === "2025-01-01")?.total).toBe(25);
    });

    it("excludes an expense inside the first bucket but before the range starts", () => {
      expect(charted(trendSeries([expense("2024-11-10", 999)], acrossNewYear, "month"))).toBe(
        0,
      );
    });

    it("emits every month at 0 when there are no expenses", () => {
      expect(totalsOf(trendSeries([], acrossNewYear, "month"))).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe("degenerate input", () => {
    it("emits no buckets when the range runs backwards, at daily granularity", () => {
      expect(trendSeries([], range("2025-01-10", "2025-01-05"))).toEqual([]);
    });

    it("emits every bucket at 0 for an empty expense list", () => {
      expect(totalsOf(trendSeries([], range("2025-08-01", "2025-08-03")))).toEqual([0, 0, 0]);
    });

    it("handles a single expense on the first day of the range", () => {
      expect(totalsOf(trendSeries([expense("2025-08-01", 5)], range("2025-08-01", "2025-08-03")))).toEqual(
        [5, 0, 0],
      );
    });

    it("handles a single expense on the last day of the range", () => {
      expect(totalsOf(trendSeries([expense("2025-08-03", 5)], range("2025-08-01", "2025-08-03")))).toEqual(
        [0, 0, 5],
      );
    });

    it("keeps zero-amount expenses from disturbing the buckets", () => {
      expect(totalsOf(trendSeries([expense("2025-08-02", 0)], range("2025-08-01", "2025-08-03")))).toEqual(
        [0, 0, 0],
      );
    });

    it("emits no buckets when the range runs backwards, at weekly granularity", () => {
      // Without the guard the cursor rewinds to Monday 6 January, which is <=
      // the end bound of 8 January, and one phantom bucket is emitted for a
      // range that contains no days at all.
      expect(trendSeries([], range("2025-01-10", "2025-01-08"), "week")).toEqual([]);
    });

    it("emits no buckets when the range runs backwards, at monthly granularity", () => {
      expect(trendSeries([], range("2025-03-10", "2025-03-08"), "month")).toEqual([]);
    });
  });
});

/* ================================================================== *
 * Monthly insights
 *
 * Not in the brief's list of exports, but analytics.ts exports these two as
 * well and they are the most date-sensitive code in the file.
 * ================================================================== */

describe("suggestedMonthlyBudget", () => {
  it("returns null when there is no history at all", () => {
    expect(suggestedMonthlyBudget([], at("2025-08-19"))).toBeNull();
  });

  it("uses last calendar month's total as the target", () => {
    const expenses = [expense("2025-07-05", 100), expense("2025-07-25", 200)];
    expect(suggestedMonthlyBudget(expenses, at("2025-08-19"))).toBe(300);
  });

  it("ignores the current month, so today's spending cannot move its own goalposts", () => {
    const expenses = [expense("2025-07-05", 100), expense("2025-08-05", 999)];
    expect(suggestedMonthlyBudget(expenses, at("2025-08-19"))).toBe(100);
  });

  it("falls back to the lifetime daily average scaled to the month when last month is empty", () => {
    // History is 300 spent between 1 Jan and 10 Jan. On 10 March the lifetime
    // range is 1 Jan – 10 Mar = 69 inclusive days, and March has 31 days.
    const expenses = [expense("2025-01-01", 100), expense("2025-01-10", 200)];
    expect(suggestedMonthlyBudget(expenses, at("2025-03-10"))).toBeCloseTo((300 / 69) * 31, 8);
  });

  it("scales the fallback by the length of the reference month", () => {
    // 300 spent on 1–2 November 2024. On 10 February 2025 the lifetime range
    // is 1 Nov – 10 Feb, 102 inclusive days, and February has 28 of them.
    // Note the lifetime denominator runs to the reference, not to the last
    // expense, so the fallback target decays the longer a user stays idle.
    const expenses = [expense("2024-11-01", 100), expense("2024-11-02", 200)];
    expect(suggestedMonthlyBudget(expenses, at("2025-02-10"))).toBeCloseTo((300 / 102) * 28, 8);
  });
});

describe("budgetStreak", () => {
  // 10 August 2025: ten days elapsed, and August has 31 days, so a £310
  // budget is a tidy £10 per day.
  const tenth = at("2025-08-10");

  it("reports no streak and no allowance when there is no budget", () => {
    const streak = budgetStreak([expense("2025-08-03", 25)], null, tenth);
    expect(streak).toEqual({
      days: 0,
      monthlyBudget: null,
      allowedSoFar: 0,
      spentSoFar: 25,
      brokenOn: null,
    });
  });

  it("pro-rates the allowance by days elapsed", () => {
    expect(budgetStreak([], 310, tenth).allowedSoFar).toBeCloseTo(100, 10);
  });

  it("counts every elapsed day when nothing has been spent", () => {
    const streak = budgetStreak([], 310, tenth);
    expect(streak.days).toBe(10);
    expect(streak.brokenOn).toBeNull();
  });

  it("reports a zero streak broken today when the month blew its budget on day one", () => {
    const streak = budgetStreak([expense("2025-08-01", 1000)], 310, tenth);
    expect(streak.days).toBe(0);
    expect(streak.brokenOn).toBe("2025-08-10");
  });

  it("heals: a quiet run of days pulls an over-pace month back under", () => {
    // £100 on 2 August is over pace until the cumulative allowance catches up
    // on the 10th, so the streak is one day and the last bad day was the 9th.
    const streak = budgetStreak([expense("2025-08-02", 100)], 310, tenth);
    expect(streak.days).toBe(1);
    expect(streak.brokenOn).toBe("2025-08-09");
  });

  it("ignores expenses dated later in the month than the reference", () => {
    const streak = budgetStreak([expense("2025-08-20", 5000)], 310, tenth);
    expect(streak.spentSoFar).toBe(0);
    expect(streak.days).toBe(10);
  });

  it("never reports a streak longer than the days elapsed this month", () => {
    expect(budgetStreak([], 310, at("2025-08-03")).days).toBe(3);
  });

  it("counts the full month correctly across the spring DST transition", () => {
    // March 2025 contains the 23-hour day; 31 days elapsed on the 31st.
    const streak = budgetStreak([], 310, at("2025-03-31"));
    expect(streak.days).toBe(31);
    expect(streak.allowedSoFar).toBeCloseTo(310, 10);
  });

  it("counts the full month correctly across the autumn DST transition", () => {
    const streak = budgetStreak([], 310, at("2025-10-31"));
    expect(streak.days).toBe(31);
    expect(streak.allowedSoFar).toBeCloseTo(310, 10);
  });

  it("reports spend to date regardless of pace", () => {
    const streak = budgetStreak(
      [expense("2025-08-01", 15), expense("2025-08-09", 5)],
      310,
      tenth,
    );
    expect(streak.spentSoFar).toBe(20);
  });
});
