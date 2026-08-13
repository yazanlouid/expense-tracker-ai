"use client";

import Link from "next/link";
import MonthlyInsights from "@/components/MonthlyInsights";
import { useExpenses } from "@/lib/storage";

export default function InsightsPage() {
  const { expenses, isLoaded } = useExpenses();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" />
            </svg>
            Dashboard
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Insights</h1>
            <p className="text-xs text-slate-400">Your month at a glance</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          </div>
        ) : (
          <MonthlyInsights expenses={expenses} />
        )}
      </main>
    </div>
  );
}
