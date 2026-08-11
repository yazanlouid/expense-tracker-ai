import type { Expense } from "@/lib/types";
import { currentMonthSpending, topCategory, totalSpending } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  expenses: Expense[];
}

interface CardDef {
  label: string;
  value: string;
  icon: string;
  accent: string;
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const total = totalSpending(expenses);
  const thisMonth = currentMonthSpending(expenses);
  const top = topCategory(expenses);
  const count = expenses.length;

  const cards: CardDef[] = [
    {
      label: "Total Spending",
      value: formatCurrency(total),
      icon: "💰",
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "This Month",
      value: formatCurrency(thisMonth),
      icon: "📅",
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Top Category",
      value: top ? `${CATEGORY_META[top.category].icon} ${top.category}` : "—",
      icon: "🏆",
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Transactions",
      value: String(count),
      icon: "🧮",
      accent: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${card.accent}`}>
              {card.icon}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
