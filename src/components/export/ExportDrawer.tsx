"use client";

import { useEffect } from "react";
import type { Expense } from "@/lib/types";
import { EXPORT_FORMAT_META } from "@/lib/export/types";
import { useExportDialog } from "@/lib/export/useExportDialog";
import { formatCurrency } from "@/lib/utils";
import CategoryFilterList from "./CategoryFilterList";
import ExportPreviewTable from "./ExportPreviewTable";
import FormatSelector from "./FormatSelector";

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

export default function ExportDrawer({ isOpen, onClose, expenses }: ExportDrawerProps) {
  const dialog = useExportDialog(expenses);

  // Start from a clean slate each time the drawer opens.
  useEffect(() => {
    if (isOpen) dialog.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isExporting = dialog.status === "exporting";
  const meta = EXPORT_FORMAT_META[dialog.format];

  async function handleExport() {
    await dialog.runExport();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-drawer-title"
        className="export-drawer-panel relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="export-drawer-title" className="text-base font-semibold text-slate-900">
              Export Expenses
            </h2>
            <p className="text-xs text-slate-400">Choose a format, filter your data, and download.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Format</span>
            <FormatSelector value={dialog.format} onChange={dialog.setFormat} />
          </section>

          <section className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                Start date
              </span>
              <input
                type="date"
                value={dialog.filters.startDate}
                onChange={(e) => dialog.setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                End date
              </span>
              <input
                type="date"
                value={dialog.filters.endDate}
                onChange={(e) => dialog.setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </section>

          <section>
            <CategoryFilterList
              selected={dialog.filters.categories}
              onToggle={dialog.toggleCategory}
              onSelectAll={dialog.setAllCategories}
            />
          </section>

          <section>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                File name
              </span>
              <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <input
                  type="text"
                  value={dialog.filenameBase}
                  onChange={(e) => dialog.setFilenameBase(e.target.value)}
                  className="min-w-0 flex-1 border-none px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none"
                />
                <span className="whitespace-nowrap bg-slate-50 px-2.5 py-1.5 text-sm text-slate-400">
                  .{meta.extension}
                </span>
              </div>
            </label>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Preview</span>
              <span className="text-xs text-slate-400">
                {dialog.filteredExpenses.length} record{dialog.filteredExpenses.length === 1 ? "" : "s"}
              </span>
            </div>
            <ExportPreviewTable expenses={dialog.filteredExpenses} />
          </section>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">
              {dialog.filteredExpenses.length} record{dialog.filteredExpenses.length === 1 ? "" : "s"} selected
            </span>
            <span className="font-semibold text-slate-800">{formatCurrency(dialog.totalAmount)}</span>
          </div>

          {dialog.status === "error" && (
            <p className="mb-3 text-xs font-medium text-red-600">{dialog.errorMessage}</p>
          )}
          {dialog.status === "success" && (
            <p className="mb-3 text-xs font-medium text-emerald-600">
              Downloaded {dialog.lastExportedFilename}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={dialog.filteredExpenses.length === 0 || isExporting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Exporting…
                </>
              ) : (
                `Export ${dialog.filteredExpenses.length} record${dialog.filteredExpenses.length === 1 ? "" : "s"} as ${meta.label}`
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
