"use client";

import { useMemo } from "react";
import { applyTemplate } from "@/lib/cloudExport/templates";
import { TEMPLATE_IDS, TEMPLATE_META, type TemplateId } from "@/lib/cloudExport/types";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface TemplatesTabProps {
  expenses: Expense[];
  selectedTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  onUseTemplate: (id: TemplateId) => void;
}

export default function TemplatesTab({
  expenses,
  selectedTemplateId,
  onSelectTemplate,
  onUseTemplate,
}: TemplatesTabProps) {
  const previews = useMemo(() => {
    const map = new Map<TemplateId, { count: number; total: number }>();
    for (const id of TEMPLATE_IDS) {
      const applied = applyTemplate(id, expenses);
      const total = applied.expenses.reduce((sum, e) => sum + e.amount, 0);
      map.set(id, { count: applied.expenses.length, total });
    }
    return map;
  }, [expenses]);

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-slate-800">Choose a template</h2>
      <p className="mb-4 text-xs text-slate-400">
        Templates pre-configure the date range, grouping, and formatting for a specific purpose.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATE_IDS.map((id) => {
          const meta = TEMPLATE_META[id];
          const preview = previews.get(id)!;
          const selected = selectedTemplateId === id;
          return (
            <div
              key={id}
              onClick={() => onSelectTemplate(id)}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selected ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{meta.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
                  <p className="text-[11px] text-slate-400">{meta.bestFor}</p>
                </div>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-slate-500">{meta.description}</p>
              <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{preview.count}</span> records
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">{formatCurrency(preview.total)}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseTemplate(id);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Use this template →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
