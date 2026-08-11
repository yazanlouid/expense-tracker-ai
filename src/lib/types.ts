export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  date: string; // ISO date string, e.g. 2026-08-11
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | "All";
  startDate: string;
  endDate: string;
}
