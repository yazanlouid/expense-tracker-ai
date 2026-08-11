import type { Expense } from "@/lib/types";
import type { ExportFilterState } from "../types";

interface JSONExportPayload {
  exportedAt: string;
  recordCount: number;
  totalAmount: number;
  filters: {
    startDate: string | null;
    endDate: string | null;
    categories: string[] | "all";
  };
  expenses: Array<Pick<Expense, "date" | "category" | "amount" | "description">>;
}

export function buildJSON(
  expenses: Expense[],
  filters: ExportFilterState,
  allCategoriesCount: number
): Blob {
  const payload: JSONExportPayload = {
    exportedAt: new Date().toISOString(),
    recordCount: expenses.length,
    totalAmount: Number(expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
    filters: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      categories: filters.categories.length === allCategoriesCount ? "all" : filters.categories,
    },
    expenses: expenses.map((e) => ({
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
    })),
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
}
