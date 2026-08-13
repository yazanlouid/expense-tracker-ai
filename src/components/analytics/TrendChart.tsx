"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

interface TrendChartProps {
  current: TrendPoint[];
  previous: TrendPoint[];
  comparisonLabel: string;
}

interface TrendDatum {
  label: string;
  total: number;
  previous: number | null;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number | string }>;
  label?: string;
  comparisonLabel: string;
}

function TrendTooltip({ active, payload, label, comparisonLabel }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const current = payload.find((p) => p.dataKey === "total");
  const previous = payload.find((p) => p.dataKey === "previous");

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      {label && <p className="font-medium text-slate-700">{label}</p>}
      <p className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        {formatCurrency(Number(current?.value ?? 0))}
      </p>
      {previous?.value != null && (
        <p className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {formatCurrency(Number(previous.value))} {comparisonLabel}
        </p>
      )}
    </div>
  );
}

export default function TrendChart({ current, previous, comparisonLabel }: TrendChartProps) {
  // Align the two periods by bucket index — they are equal-length ranges, so
  // bucket N of the previous period is the like-for-like counterpart.
  const data: TrendDatum[] = current.map((point, index) => ({
    label: point.label,
    total: point.total,
    previous: previous[index]?.total ?? null,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No data in this period
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Selected period
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          {comparisonLabel}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={48}
            />
            <Tooltip
              content={<TrendTooltip comparisonLabel={comparisonLabel} />}
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
