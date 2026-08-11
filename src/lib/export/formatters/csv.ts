import type { Expense } from "@/lib/types";

const COLUMNS = ["Date", "Category", "Amount", "Description"] as const;

function escapeCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildCSV(expenses: Expense[]): Blob {
  const rows = expenses.map((e) => [e.date, e.category, e.amount.toFixed(2), e.description]);
  const text = [COLUMNS, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
  return new Blob([text], { type: "text/csv;charset=utf-8;" });
}
