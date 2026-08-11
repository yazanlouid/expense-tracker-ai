"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Expense } from "@/lib/types";
import { monthlyTrend, spendingByCategory } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

interface ChartsProps {
  expenses: Expense[];
}

interface CurrencyTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}

function CurrencyTooltip({ active, payload, label }: CurrencyTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      {label && <p className="font-medium text-slate-700">{label}</p>}
      <p className="text-slate-500">{formatCurrency(value)}</p>
    </div>
  );
}

export default function Charts({ expenses }: ChartsProps) {
  const categoryTotals = spendingByCategory(expenses);
  const trend = monthlyTrend(expenses);
  const hasCategoryData = categoryTotals.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Spending by Category</h3>
        {hasCategoryData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categoryTotals.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_META[entry.category].color} />
                  ))}
                </Pie>
                <Tooltip content={<CurrencyTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No data to display
          </div>
        )}
        {hasCategoryData && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {categoryTotals.map((entry) => (
              <div key={entry.category} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_META[entry.category].color }}
                />
                {entry.category}
                <span className="text-slate-400">{formatCurrency(entry.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Monthly Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={48}
              />
              <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
