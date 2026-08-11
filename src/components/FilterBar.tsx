"use client";

import { EXPENSE_CATEGORIES, type ExpenseFilters } from "@/lib/types";

interface FilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onReset: () => void;
  resultCount: number;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";

export default function FilterBar({ filters, onChange, onReset, resultCount }: FilterBarProps) {
  const hasActiveFilters =
    filters.search !== "" || filters.category !== "All" || filters.startDate !== "" || filters.endDate !== "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-slate-500">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search descriptions..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category-filter" className="mb-1 block text-xs font-medium text-slate-500">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as ExpenseFilters["category"] })}
            className={inputClass}
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="mb-1 block text-xs font-medium text-slate-500">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="end-date" className="mb-1 block text-xs font-medium text-slate-500">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {resultCount} {resultCount === 1 ? "expense" : "expenses"} found
        </p>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
