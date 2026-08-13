"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  budgetStreak,
  expensesInRange,
  resolvePeriod,
  spendingByCategory,
  suggestedMonthlyBudget,
  totalSpending,
} from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import type { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MonthlyInsightsProps {
  expenses: Expense[];
}

const TOP_CATEGORY_COUNT = 3;

interface CurrencyTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
}

function SliceTooltip({ active, payload }: CurrencyTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-700">{slice.name}</p>
      <p className="text-slate-500">{formatCurrency(Number(slice.value ?? 0))}</p>
    </div>
  );
}

export default function MonthlyInsights({ expenses }: MonthlyInsightsProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const range = resolvePeriod("thisMonth", expenses, now);
    const monthExpenses = expensesInRange(expenses, range);
    const categories = spendingByCategory(monthExpenses);
    const monthlyBudget = suggestedMonthlyBudget(expenses, now);

    return {
      monthLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      total: totalSpending(monthExpenses),
      categories,
      top: categories.slice(0, TOP_CATEGORY_COUNT),
      rest: categories.slice(TOP_CATEGORY_COUNT),
      streak: budgetStreak(expenses, monthlyBudget, now),
    };
  }, [expenses]);

  const { categories, top, rest, streak } = insights;
  const hasSpending = categories.length > 0;
  const restTotal = rest.reduce((sum, entry) => sum + entry.total, 0);

  // The donut separates categories by colour alone, and CATEGORY_META's palette
  // is not colourblind-safe, so every slice is also named in the chart's
  // accessible label and the top three are direct-labelled in the list below.
  const chartLabel = `Spending by category for ${insights.monthLabel}: ${categories
    .map((entry) => `${entry.category} ${formatCurrency(entry.total)}`)
    .join(", ")}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Monthly Insights
        </h2>
        <p className="mt-0.5 text-center text-xs text-slate-400">{insights.monthLabel}</p>
      </div>

      {hasSpending ? (
        <>
          <div className="relative mx-auto mt-5 h-56 w-56" role="img" aria-label={chartLabel}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={2}
                  stroke="none"
                >
                  {categories.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_META[entry.category].color} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Spending
              </span>
              <span className="text-xl font-semibold text-slate-900">
                {formatCurrency(insights.total)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Where it went</h3>
              <span className="text-xs italic text-slate-400">Top {top.length}</span>
            </div>

            <ul className="mt-3 space-y-3">
              {top.map((entry) => {
                const meta = CATEGORY_META[entry.category];
                return (
                  <li key={entry.category} className="flex items-center gap-3">
                    <span
                      className="h-7 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span aria-hidden>{meta.icon}</span>
                    <span className="text-slate-700">{entry.category}:</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(entry.total)}
                    </span>
                  </li>
                );
              })}
            </ul>

            {rest.length > 0 && (
              <p className="mt-3 pl-[18px] text-xs text-slate-400">
                +{rest.length} more {rest.length === 1 ? "category" : "categories"} ·{" "}
                {formatCurrency(restTotal)}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 flex h-56 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-slate-500">Nothing logged in {insights.monthLabel} yet.</p>
          <p className="text-xs text-slate-400">Add an expense to see your breakdown.</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-5 text-center">
        <p className="text-sm font-semibold text-slate-700">Budget Streak</p>

        {streak.monthlyBudget === null ? (
          <p className="mt-2 text-sm text-slate-400">
            Log a month of expenses and we&apos;ll track your streak against your own average.
          </p>
        ) : (
          <>
            <div className="mt-1 flex items-center justify-center gap-3">
              <p
                className={`text-4xl font-bold ${
                  streak.days > 0 ? "text-emerald-500" : "text-slate-300"
                }`}
              >
                {streak.days}
              </p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {formatCurrency(streak.monthlyBudget)}/mo target
              </span>
            </div>
            <p className="text-sm text-slate-600">{streak.days === 1 ? "day!" : "days!"}</p>
            <p className="mt-2 text-xs text-slate-400">
              {streak.days === 0 && "Over pace · "}
              {formatCurrency(streak.spentSoFar)} of {formatCurrency(streak.allowedSoFar)} allowed
              so far
              {streak.days > 0 &&
                (streak.brokenOn
                  ? ` · last off pace ${formatDate(streak.brokenOn)}`
                  : " · on pace all month")}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
