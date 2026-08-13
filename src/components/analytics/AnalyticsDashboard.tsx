"use client";

import { useMemo, useState } from "react";
import {
  categoryComparison,
  expensesInRange,
  pickGranularity,
  previousRange,
  resolvePeriod,
  statsForRange,
  trendSeries,
  type PeriodKey,
} from "@/lib/analytics";
import type { Expense } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import CategoryBreakdown from "./CategoryBreakdown";
import ComparisonCards from "./ComparisonCards";
import PeriodSelector from "./PeriodSelector";
import TrendChart from "./TrendChart";

interface AnalyticsDashboardProps {
  expenses: Expense[];
}

const COMPARISON_LABEL = "vs previous period";

export default function AnalyticsDashboard({ expenses }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>("thisMonth");

  const analysis = useMemo(() => {
    const range = resolvePeriod(period, expenses);
    // "All time" already spans every expense, so there is nothing before it.
    const comparisonRange = period === "allTime" ? null : previousRange(range);
    const granularity = pickGranularity(range);

    const currentExpenses = expensesInRange(expenses, range);
    const priorExpenses = comparisonRange ? expensesInRange(expenses, comparisonRange) : [];

    return {
      range,
      currentStats: statsForRange(currentExpenses, range),
      priorStats: comparisonRange ? statsForRange(priorExpenses, comparisonRange) : null,
      currentTrend: trendSeries(expenses, range, granularity),
      priorTrend: comparisonRange ? trendSeries(expenses, comparisonRange, granularity) : [],
      categories: categoryComparison(currentExpenses, priorExpenses),
    };
  }, [expenses, period]);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Analytics</h2>
          <p className="text-xs text-slate-400">
            {formatDate(analysis.range.start)} — {formatDate(analysis.range.end)}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <ComparisonCards
        current={analysis.currentStats}
        previous={analysis.priorStats}
        comparisonLabel={COMPARISON_LABEL}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 p-3 lg:col-span-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Spending over time</h3>
          <TrendChart
            current={analysis.currentTrend}
            previous={analysis.priorTrend}
            comparisonLabel={COMPARISON_LABEL}
          />
        </div>

        <div className="rounded-lg border border-slate-200 p-3 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Category breakdown</h3>
          <CategoryBreakdown
            categories={analysis.categories}
            comparisonLabel={COMPARISON_LABEL}
          />
        </div>
      </div>
    </section>
  );
}
