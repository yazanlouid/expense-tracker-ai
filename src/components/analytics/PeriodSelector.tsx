"use client";

import { PERIOD_KEYS, PERIOD_LABELS, type PeriodKey } from "@/lib/analytics";

interface PeriodSelectorProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Analytics period">
      {PERIOD_KEYS.map((period) => {
        const isActive = period === value;
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            aria-pressed={isActive}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {PERIOD_LABELS[period]}
          </button>
        );
      })}
    </div>
  );
}
