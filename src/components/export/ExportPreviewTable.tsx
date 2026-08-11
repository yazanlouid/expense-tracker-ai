"use client";

import { CATEGORY_META } from "@/lib/categories";
import type { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExportPreviewTableProps {
  expenses: Expense[];
  maxRows?: number;
}

export default function ExportPreviewTable({ expenses, maxRows = 6 }: ExportPreviewTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-10 text-center">
        <span className="text-2xl">🗂️</span>
        <p className="text-sm font-medium text-slate-600">No records match these filters</p>
        <p className="text-xs text-slate-400">Adjust the date range or categories to include data.</p>
      </div>
    );
  }

  const visible = expenses.slice(0, maxRows);
  const remaining = expenses.length - visible.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium text-right">Amount</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visible.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(e.date)}</td>
              <td className="whitespace-nowrap px-3 py-2">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  {CATEGORY_META[e.category].icon} {e.category}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-slate-800">
                {formatCurrency(e.amount)}
              </td>
              <td className="truncate px-3 py-2 text-slate-500">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {remaining > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">
          + {remaining} more row{remaining === 1 ? "" : "s"} in the full export
        </div>
      )}
    </div>
  );
}
