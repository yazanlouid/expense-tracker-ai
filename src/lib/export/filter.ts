import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { Expense } from "@/lib/types";
import type { ExportFilterState } from "./types";

export function applyExportFilters(expenses: Expense[], filters: ExportFilterState): Expense[] {
  const allCategoriesSelected = filters.categories.length === EXPENSE_CATEGORIES.length;

  return expenses
    .filter((e) => (filters.startDate ? e.date >= filters.startDate : true))
    .filter((e) => (filters.endDate ? e.date <= filters.endDate : true))
    .filter((e) => (allCategoriesSelected ? true : filters.categories.includes(e.category)))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
}

export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((total, e) => total + e.amount, 0);
}
