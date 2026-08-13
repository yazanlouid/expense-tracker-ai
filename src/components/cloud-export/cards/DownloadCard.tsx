"use client";

import { useState } from "react";
import { downloadBlob } from "@/lib/cloudExport/download";
import { buildReportBlob } from "@/lib/cloudExport/report";
import { applyTemplate } from "@/lib/cloudExport/templates";
import { DESTINATION_META, TEMPLATE_META, type TemplateId } from "@/lib/cloudExport/types";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import type { Expense } from "@/lib/types";

interface DownloadCardProps {
  expenses: Expense[];
  templateId: TemplateId;
  center: ExportCenterState;
}

export default function DownloadCard({ expenses, templateId, center }: DownloadCardProps) {
  const meta = DESTINATION_META.download;
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    const applied = applyTemplate(templateId, expenses);
    await new Promise((r) => setTimeout(r, 250));
    const blob = buildReportBlob(format, applied);
    downloadBlob(`${applied.filenameBase}.${format}`, blob);
    center.addHistoryEntry({
      templateId,
      destination: "download",
      recordCount: applied.expenses.length,
      totalAmount: applied.expenses.reduce((sum, e) => sum + e.amount, 0),
      status: "success",
      detail: `${applied.filenameBase}.${format}`,
    });
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
            <p className="text-[11px] text-slate-400">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-xs">
        {(["csv", "pdf"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              format === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="mb-3 text-[11px] text-slate-400">
        Using <span className="font-medium text-slate-600">{TEMPLATE_META[templateId].label}</span> template
      </p>

      <button
        onClick={handleDownload}
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : `Download ${format.toUpperCase()}`}
      </button>
    </div>
  );
}
