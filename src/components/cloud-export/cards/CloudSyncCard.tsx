"use client";

import { useState } from "react";
import { applyTemplate } from "@/lib/cloudExport/templates";
import { delay, withStagedProgress } from "@/lib/cloudExport/simulate";
import { DESTINATION_META, type DestinationId, type TemplateId } from "@/lib/cloudExport/types";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import type { Expense } from "@/lib/types";
import StatusBadge from "../StatusBadge";

interface CloudSyncCardProps {
  destination: Extract<DestinationId, "dropbox" | "onedrive">;
  expenses: Expense[];
  templateId: TemplateId;
  center: ExportCenterState;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

export default function CloudSyncCard({ destination, expenses, templateId, center }: CloudSyncCardProps) {
  const meta = DESTINATION_META[destination];
  const connection = center.connections[destination];
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleConnect() {
    center.setConnection(destination, { status: "connecting" });
    await delay(800);
    center.setConnection(destination, {
      status: "connected",
      accountLabel: destination === "dropbox" ? "demo.user@dropbox.com" : "demo.user@outlook.com",
    });
  }

  function handleDisconnect() {
    center.setConnection(destination, { status: "disconnected", accountLabel: null, lastSyncedAt: null });
  }

  async function handleSync() {
    setSyncing(true);
    setProgress(0);
    const applied = applyTemplate(templateId, expenses);
    await withStagedProgress(1000, setProgress);
    center.setConnection(destination, { lastSyncedAt: new Date().toISOString() });
    center.addHistoryEntry({
      templateId,
      destination,
      recordCount: applied.expenses.length,
      totalAmount: applied.expenses.reduce((sum, e) => sum + e.amount, 0),
      status: "success",
      detail: `Synced ${applied.filenameBase}.csv to ${meta.label}`,
    });
    setSyncing(false);
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
          {connection.status === "connecting" ? "Connecting…" : `Connect ${meta.label}`}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">{connection.accountLabel}</p>

          {syncing ? (
            <div>
              <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Uploading… {progress}%</p>
            </div>
          ) : (
            <button
              onClick={handleSync}
              className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              Sync now
            </button>
          )}

          {connection.lastSyncedAt && !syncing && (
            <StatusBadge label={`Synced ${timeAgo(connection.lastSyncedAt)}`} tone="success" />
          )}

          <button onClick={handleDisconnect} className="block text-[11px] font-medium text-slate-400 hover:text-red-600">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
