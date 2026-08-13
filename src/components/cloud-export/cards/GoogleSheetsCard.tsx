"use client";

import { useState } from "react";
import { applyTemplate } from "@/lib/cloudExport/templates";
import { delay } from "@/lib/cloudExport/simulate";
import { DESTINATION_META, type TemplateId } from "@/lib/cloudExport/types";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import type { Expense } from "@/lib/types";
import StatusBadge from "../StatusBadge";

interface GoogleSheetsCardProps {
  expenses: Expense[];
  templateId: TemplateId;
  center: ExportCenterState;
}

export default function GoogleSheetsCard({ expenses, templateId, center }: GoogleSheetsCardProps) {
  const meta = DESTINATION_META["google-sheets"];
  const connection = center.connections["google-sheets"];
  const [creating, setCreating] = useState(false);
  const [sheetName, setSheetName] = useState<string | null>(null);

  async function handleConnect() {
    center.setConnection("google-sheets", { status: "connecting" });
    await delay(900);
    center.setConnection("google-sheets", { status: "connected", accountLabel: "demo.user@gmail.com" });
  }

  function handleDisconnect() {
    center.setConnection("google-sheets", { status: "disconnected", accountLabel: null, lastSyncedAt: null });
    setSheetName(null);
  }

  async function handleCreateSheet() {
    setCreating(true);
    const applied = applyTemplate(templateId, expenses);
    await delay(1200);
    const name = `${applied.filenameBase}-${Date.now().toString(36)}`;
    setSheetName(name);
    center.setConnection("google-sheets", { lastSyncedAt: new Date().toISOString() });
    center.addHistoryEntry({
      templateId,
      destination: "google-sheets",
      recordCount: applied.expenses.length,
      totalAmount: applied.expenses.reduce((sum, e) => sum + e.amount, 0),
      status: "success",
      detail: `Created spreadsheet "${name}"`,
    });
    setCreating(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
            <p className="text-[11px] text-slate-400">{meta.description}</p>
          </div>
        </div>
        {connection.status === "connected" && <StatusBadge label="Connected" tone="success" />}
        {connection.status === "connecting" && <StatusBadge label="Connecting…" tone="info" pulse />}
        {connection.status === "disconnected" && <StatusBadge label="Not connected" tone="neutral" />}
      </div>

      {connection.status !== "connected" ? (
        <button
          onClick={handleConnect}
          disabled={connection.status === "connecting"}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connection.status === "connecting" ? "Connecting to Google…" : "Connect Google account"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">Signed in as {connection.accountLabel}</p>

          {sheetName ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="text-[11px] font-medium text-emerald-700">Spreadsheet ready</p>
              <p className="truncate text-xs text-emerald-800">{sheetName}</p>
              <p className="mt-1 text-[10px] text-emerald-600">Demo link — not a real, browsable spreadsheet</p>
            </div>
          ) : (
            <button
              onClick={handleCreateSheet}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating spreadsheet…
                </>
              ) : (
                "Create spreadsheet"
              )}
            </button>
          )}

          <button onClick={handleDisconnect} className="text-[11px] font-medium text-slate-400 hover:text-red-600">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
