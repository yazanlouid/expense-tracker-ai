"use client";

import { useCallback, useEffect, useState } from "react";
import type { Expense, ExpenseInput } from "./types";
import { todayISO } from "./utils";

const STORAGE_KEY = "expense-tracker:expenses";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function shiftDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function seedExpenses(): Expense[] {
  const seed: ExpenseInput[] = [
    { date: shiftDate(1), amount: 42.5, category: "Food", description: "Groceries - weekly shop" },
    { date: shiftDate(2), amount: 15.0, category: "Transportation", description: "Ride share to office" },
    { date: shiftDate(3), amount: 89.99, category: "Bills", description: "Internet & phone bill" },
    { date: shiftDate(5), amount: 32.0, category: "Entertainment", description: "Movie night" },
    { date: shiftDate(6), amount: 120.0, category: "Shopping", description: "New running shoes" },
    { date: shiftDate(9), amount: 8.75, category: "Food", description: "Coffee shop" },
    { date: shiftDate(12), amount: 60.0, category: "Transportation", description: "Gas fill-up" },
    { date: shiftDate(18), amount: 200.0, category: "Bills", description: "Electricity bill" },
    { date: shiftDate(25), amount: 27.4, category: "Other", description: "Pharmacy" },
    { date: shiftDate(35), amount: 55.2, category: "Food", description: "Dinner out" },
  ];
  return seed.map((item) => ({
    ...item,
    id: generateId(),
    createdAt: new Date(0).toISOString(),
  }));
}

function loadFromStorage(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedExpenses();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadFromStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isLoaded]);

  const addExpense = useCallback((input: ExpenseInput) => {
    const expense: Expense = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback((id: string, input: ExpenseInput) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...input } : e))
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setExpenses([]);
  }, []);

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAll,
  };
}

export { todayISO };
