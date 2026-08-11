"use client";

import { CATEGORY_META } from "@/lib/categories";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";

interface CategoryFilterListProps {
  selected: ExpenseCategory[];
  onToggle: (category: ExpenseCategory) => void;
  onSelectAll: (selected: boolean) => void;
}

export default function CategoryFilterList({ selected, onToggle, onSelectAll }: CategoryFilterListProps) {
  const allSelected = selected.length === EXPENSE_CATEGORIES.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Categories</span>
        <button
          type="button"
          onClick={() => onSelectAll(!allSelected)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXPENSE_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const isSelected = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(category)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isSelected
                  ? "border-transparent bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              <span>{meta.icon}</span>
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
