import type { Expense, ExpenseCategory } from "./types";
import { monthKey } from "./utils";

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

export interface MonthlyTotal {
  month: string; // YYYY-MM
  label: string; // e.g. "Mar 2026"
  total: number;
}

export function totalSpending(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function currentMonthSpending(expenses: Expense[], reference: Date = new Date()): number {
  const key = monthKey(reference.toISOString().slice(0, 10));
  return expenses.filter((e) => monthKey(e.date) === key).reduce((sum, e) => sum + e.amount, 0);
}

export function spendingByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function topCategory(expenses: Expense[]): CategoryTotal | null {
  const totals = spendingByCategory(expenses);
  return totals.length > 0 ? totals[0] : null;
}

export function monthlyTrend(expenses: Expense[], monthsBack = 6): MonthlyTotal[] {
  const now = new Date();
  const months: MonthlyTotal[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    months.push({ month: key, label, total: 0 });
  }

  const byMonth = new Map(months.map((m) => [m.month, m]));
  for (const e of expenses) {
    const key = monthKey(e.date);
    const bucket = byMonth.get(key);
    if (bucket) bucket.total += e.amount;
  }

  return months;
}
