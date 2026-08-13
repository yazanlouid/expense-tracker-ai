import type { CategoryComparison } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import DeltaBadge from "./DeltaBadge";

interface CategoryBreakdownProps {
  categories: CategoryComparison[];
  comparisonLabel: string;
}

export default function CategoryBreakdown({ categories, comparisonLabel }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-400">
        No spending in this period
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {categories.map((entry) => {
        const meta = CATEGORY_META[entry.category];
        return (
          <li key={entry.category}>
            <div className="flex items-baseline justify-between gap-3">
              {/* Name and amount are always rendered, so the bar colour is never
                  the only thing distinguishing one category from another. */}
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                <span aria-hidden>{meta.icon}</span>
                {entry.category}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(entry.total)}
                </span>
                <span className="text-xs text-slate-400">{(entry.share * 100).toFixed(0)}%</span>
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(entry.share * 100, 1)}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
              <DeltaBadge change={entry.change} riseIsBad />
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {formatCurrency(entry.previousTotal)} {comparisonLabel}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
