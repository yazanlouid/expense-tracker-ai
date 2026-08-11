"use client";

import { EXPORT_FORMATS, EXPORT_FORMAT_META, type ExportFormat } from "@/lib/export/types";

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

const FORMAT_ICONS: Record<ExportFormat, string> = {
  csv: "📊",
  json: "🧩",
  pdf: "📄",
};

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Export format" className="grid grid-cols-3 gap-2">
      {EXPORT_FORMATS.map((format) => {
        const meta = EXPORT_FORMAT_META[format];
        const selected = value === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(format)}
            className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition ${
              selected
                ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="text-lg leading-none">{FORMAT_ICONS[format]}</span>
            <span className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-slate-800"}`}>
              {meta.label}
            </span>
            <span className="text-[11px] leading-snug text-slate-500">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}
