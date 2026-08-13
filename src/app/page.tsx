"use client";

import { useMemo, useState } from "react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import Charts from "@/components/Charts";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExportButton from "@/components/ExportButton";
import FilterBar from "@/components/FilterBar";
import Modal from "@/components/Modal";
import SummaryCards from "@/components/SummaryCards";
import Toast, { type ToastState } from "@/components/Toast";
import { useExpenses } from "@/lib/storage";
import type { Expense, ExpenseFilters, ExpenseInput } from "@/lib/types";

const EMPTY_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
};

export default function Home() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense, clearAll } = useExpenses();
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function notify(message: string, type: ToastState["type"] = "success") {
    setToast({ id: Date.now(), message, type });
  }

  const filteredExpenses = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return expenses
      .filter((e) => (search ? e.description.toLowerCase().includes(search) : true))
      .filter((e) => (filters.category !== "All" ? e.category === filters.category : true))
      .filter((e) => (filters.startDate ? e.date >= filters.startDate : true))
      .filter((e) => (filters.endDate ? e.date <= filters.endDate : true))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
  }, [expenses, filters]);

  function openAddForm() {
    setEditingExpense(null);
    setIsFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingExpense(null);
  }

  function handleSubmit(input: ExpenseInput) {
    if (editingExpense) {
      updateExpense(editingExpense.id, input);
      notify("Expense updated successfully.");
    } else {
      addExpense(input);
      notify("Expense added successfully.");
    }
    closeForm();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteExpense(deleteTarget.id);
    notify("Expense deleted.");
    setDeleteTarget(null);
  }

  function confirmClearAll() {
    clearAll();
    notify("All expenses cleared.");
    setIsClearOpen(false);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white">
              💸
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">ExpenseTracker</h1>
              <p className="text-xs text-slate-400">Manage your personal finances</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton expenses={filteredExpenses} />
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          </div>
        ) : (
          <>
            <SummaryCards expenses={expenses} />
            <Charts expenses={expenses} />
            <AnalyticsDashboard expenses={expenses} />

            <FilterBar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_FILTERS)}
              resultCount={filteredExpenses.length}
            />

            <ExpenseList expenses={filteredExpenses} onEdit={openEditForm} onDelete={setDeleteTarget} />

            {expenses.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setIsClearOpen(true)}
                  className="text-xs font-medium text-slate-400 transition hover:text-red-600"
                >
                  Clear all data
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Modal title={editingExpense ? "Edit Expense" : "Add Expense"} isOpen={isFormOpen} onClose={closeForm}>
        <ExpenseForm initialValue={editingExpense} onSubmit={handleSubmit} onCancel={closeForm} />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Expense"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.description}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={isClearOpen}
        title="Clear All Data"
        message="This will permanently delete all your expenses from this browser. This action cannot be undone."
        confirmLabel="Clear All"
        onConfirm={confirmClearAll}
        onCancel={() => setIsClearOpen(false)}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
