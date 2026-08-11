"use client";

import type { Expense } from "@/lib/types";
import { downloadCSV, expensesToCSV, todayISO } from "@/lib/utils";

interface ExportButtonProps {
  expenses: Expense[];
}

export default function ExportButton({ expenses }: ExportButtonProps) {
  function handleExport() {
    const csv = expensesToCSV(expenses);
    downloadCSV(`expenses-${todayISO()}.csv`, csv);
  }

  return (
    <button
      onClick={handleExport}
      disabled={expenses.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M10 12.5a.75.75 0 01-.53-.22l-3.5-3.5a.75.75 0 111.06-1.06L9.25 9.94V3.75a.75.75 0 011.5 0v6.19l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-.53.22zM4.5 14.75a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 01-.75-.75z"
          clipRule="evenodd"
        />
      </svg>
      Export CSV
    </button>
  );
}
