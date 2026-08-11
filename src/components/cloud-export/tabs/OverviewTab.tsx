"use client";

import { useMemo } from "react";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import { DESTINATION_IDS, DESTINATION_META } from "@/lib/cloudExport/types";

const CONNECTABLE_DESTINATIONS = DESTINATION_IDS.filter((id) => DESTINATION_META[id].requiresConnection);
import type { Expense } from "@/lib/types";
import type { TabId } from "../ExportCenter";

interface OverviewTabProps {
  expenses: Expense[];
  center: ExportCenterState;
  onNavigate: (tab: TabId) => void;
}

function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export default function OverviewTab({ expenses, center, onNavigate }: OverviewTabProps) {
  const stats = useMemo(() => {
    const connected = CONNECTABLE_DESTINATIONS.filter((id) => center.connections[id].status === "connected").length;
    const activeSchedules = center.schedules.filter((s) => s.enabled).length;
    const now = Date.now();
    const activeShares = center.shares.filter(
      (s) => !s.revoked && (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
    ).length;
    const thisMonthKey = monthKey();
    const exportsThisMonth = center.history.filter((h) => h.timestamp.startsWith(thisMonthKey)).length;
    return { connected, activeSchedules, activeShares, exportsThisMonth };
  }, [center]);

  const suggestion = useMemo(() => {
    const lastMonthly = center.history.find((h) => h.templateId === "monthly-summary");
    if (!lastMonthly) return null;
    const newSince = expenses.filter((e) => e.createdAt > lastMonthly.timestamp).length;
    if (newSince === 0) return null;
    return `You've logged ${newSince} new expense${newSince === 1 ? "" : "s"} since your last Monthly Summary export.`;
  }, [center.history, expenses]);

  return (
    <div>
      {suggestion && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <p className="text-xs text-amber-800">{suggestion}</p>
          </div>
          <button
            onClick={() => onNavigate("destinations")}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
          >
            Export now
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => onNavigate("destinations")}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Connected</p>
          <p className="text-xl font-semibold text-slate-800">{stats.connected}/{CONNECTABLE_DESTINATIONS.length}</p>
          <p className="text-[11px] text-slate-400">cloud services</p>
        </button>
        <button
          onClick={() => onNavigate("schedule")}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Schedules</p>
          <p className="text-xl font-semibold text-slate-800">{stats.activeSchedules}</p>
          <p className="text-[11px] text-slate-400">active</p>
        </button>
        <button
          onClick={() => onNavigate("share")}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Share links</p>
          <p className="text-xl font-semibold text-slate-800">{stats.activeShares}</p>
          <p className="text-[11px] text-slate-400">live</p>
        </button>
        <button
          onClick={() => onNavigate("history")}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">This month</p>
          <p className="text-xl font-semibold text-slate-800">{stats.exportsThisMonth}</p>
          <p className="text-[11px] text-slate-400">exports</p>
        </button>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-800">Connected services</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CONNECTABLE_DESTINATIONS.map((id) => {
          const meta = DESTINATION_META[id];
          const connection = center.connections[id];
          return (
            <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span>{meta.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">{meta.label}</p>
                <p className="text-[10px] text-slate-400">
                  {connection.status === "connected" ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Get started in{" "}
        <button onClick={() => onNavigate("templates")} className="font-medium text-indigo-600 hover:underline">
          Templates
        </button>{" "}
        to pick what to export, then send it from{" "}
        <button onClick={() => onNavigate("destinations")} className="font-medium text-indigo-600 hover:underline">
          Destinations
        </button>
        .
      </p>
    </div>
  );
}
