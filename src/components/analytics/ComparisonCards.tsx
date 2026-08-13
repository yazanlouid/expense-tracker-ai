import { percentChange, type PeriodStats } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import DeltaBadge from "./DeltaBadge";

interface ComparisonCardsProps {
  current: PeriodStats;
  previous: PeriodStats | null;
  comparisonLabel: string;
}

interface CardDef {
  label: string;
  value: string;
  change: number | null;
  riseIsBad: boolean;
}

export default function ComparisonCards({ current, previous, comparisonLabel }: ComparisonCardsProps) {
  const cards: CardDef[] = [
    {
      label: "Total spent",
      value: formatCurrency(current.total),
      change: previous ? percentChange(current.total, previous.total) : null,
      riseIsBad: true,
    },
    {
      label: "Avg / day",
      value: formatCurrency(current.averagePerDay),
      change: previous ? percentChange(current.averagePerDay, previous.averagePerDay) : null,
      riseIsBad: true,
    },
    {
      label: "Transactions",
      value: String(current.count),
      change: previous ? percentChange(current.count, previous.count) : null,
      riseIsBad: false,
    },
    {
      label: "Avg / transaction",
      value: formatCurrency(current.averageTransaction),
      change: previous ? percentChange(current.averageTransaction, previous.averageTransaction) : null,
      riseIsBad: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{card.value}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <DeltaBadge change={card.change} riseIsBad={card.riseIsBad} />
            {card.change !== null && <span className="text-xs text-slate-400">{comparisonLabel}</span>}
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4">
        <p className="text-xs font-medium text-slate-500">Top category this period</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">
          {current.top
            ? `${CATEGORY_META[current.top.category].icon} ${current.top.category} — ${formatCurrency(current.top.total)}`
            : "—"}
        </p>
      </div>
    </div>
  );
}
