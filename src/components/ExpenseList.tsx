"use client";

import type { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import CategoryBadge from "./CategoryBadge";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 py-16 text-center">
        <span className="text-3xl">🔍</span>
        <p className="mt-2 text-sm font-medium text-slate-600">No expenses found</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or add a new expense.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[110px_1fr_140px_110px_88px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 transition hover:bg-slate-50 sm:grid-cols-[110px_1fr_140px_110px_88px] sm:items-center"
          >
            <span className="text-sm text-slate-500 sm:text-slate-600">{formatDate(expense.date)}</span>
            <span className="col-span-2 truncate text-sm font-medium text-slate-900 sm:col-span-1" title={expense.description}>
              {expense.description}
            </span>
            <span>
              <CategoryBadge category={expense.category} />
            </span>
            <span className="text-right text-sm font-semibold text-slate-900 sm:text-right">
              {formatCurrency(expense.amount)}
            </span>
            <span className="flex justify-end gap-2">
              <button
                onClick={() => onEdit(expense)}
                aria-label={`Edit ${expense.description}`}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(expense)}
                aria-label={`Delete ${expense.description}`}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.25H3.5a.75.75 0 000 1.5h.583l.628 9.42A2.75 2.75 0 007.455 17.5h5.09a2.75 2.75 0 002.744-2.58l.628-9.42h.583a.75.75 0 000-1.5H14v-.25A2.75 2.75 0 0011.25 1h-2.5zM10 4.5h1.5v-.25a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 006.5 4.25v.25H10zm-3.5 3a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6zm5 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
