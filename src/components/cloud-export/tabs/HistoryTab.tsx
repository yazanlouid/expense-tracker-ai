"use client";

import { downloadBlob } from "@/lib/cloudExport/download";
import { buildReportBlob } from "@/lib/cloudExport/report";
import { applyTemplate } from "@/lib/cloudExport/templates";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import { DESTINATION_META, TEMPLATE_META } from "@/lib/cloudExport/types";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "../StatusBadge";

interface HistoryTabProps {
  center: ExportCenterState;
  expenses: Expense[];
}

export default function HistoryTab({ center, expenses }: HistoryTabProps) {
  function redownload(templateId: (typeof center.history)[number]["templateId"]) {
    const applied = applyTemplate(templateId, expenses);
    const blob = buildReportBlob("csv", applied);
    downloadBlob(`${applied.filenameBase}.csv`, blob);
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-slate-800">Export activity</h2>
      <p className="mb-4 text-xs text-slate-400">
        Every export you trigger in this Export Center shows up here, newest first.
      </p>

      {center.history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-xs text-slate-400">
          Nothing exported yet in this session. Try a destination or a share link to see it appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {center.history.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{DESTINATION_META[entry.destination].icon}</span>
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {TEMPLATE_META[entry.templateId].label} via {DESTINATION_META[entry.destination].label}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleString("en-US")} · {entry.recordCount} records ·{" "}
                    {formatCurrency(entry.totalAmount)}
                  </p>
                  {entry.detail && <p className="text-[11px] text-slate-400">{entry.detail}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={entry.status === "success" ? "Success" : "Failed"}
                  tone={entry.status === "success" ? "success" : "danger"}
                />
                {entry.destination === "download" && (
                  <button
                    onClick={() => redownload(entry.templateId)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Download again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
