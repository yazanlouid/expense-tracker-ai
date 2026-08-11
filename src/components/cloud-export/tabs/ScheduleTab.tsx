"use client";

import { useState } from "react";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import { describeSchedule, formatNextRun } from "@/lib/cloudExport/schedule";
import {
  DESTINATION_IDS,
  DESTINATION_META,
  TEMPLATE_IDS,
  TEMPLATE_META,
  type DestinationId,
  type ScheduleFrequency,
  type TemplateId,
} from "@/lib/cloudExport/types";
import StatusBadge from "../StatusBadge";

interface ScheduleTabProps {
  center: ExportCenterState;
  selectedTemplateId: TemplateId;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ScheduleTab({ center, selectedTemplateId }: ScheduleTabProps) {
  const [templateId, setTemplateId] = useState<TemplateId>(selectedTemplateId);
  const [destination, setDestination] = useState<DestinationId>("email");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("monthly");
  const [time, setTime] = useState("09:00");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  function handleCreate() {
    center.addSchedule({ templateId, destination, frequency, time, dayOfWeek, dayOfMonth });
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-slate-800">Automatic backups</h2>
      <p className="mb-4 text-xs text-slate-400">
        Set up a recurring export. In this demo, schedules are saved and their next run time is calculated —
        actually firing them in the background would need a server component.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_META[id].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as DestinationId)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          >
            {DESTINATION_IDS.map((id) => (
              <option key={id} value={id}>
                {DESTINATION_META[id].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Frequency</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          />
        </label>

        {frequency === "weekly" && (
          <label className="col-span-2 block text-xs">
            <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Day of week</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}

        {frequency === "monthly" && (
          <label className="col-span-2 block text-xs">
            <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Day of month</span>
            <input
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
            />
          </label>
        )}

        <div className="col-span-2 flex items-end sm:col-span-4">
          <button
            onClick={handleCreate}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Create schedule
          </button>
        </div>
      </div>

      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Active schedules ({center.schedules.length})
      </h3>

      {center.schedules.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
          No schedules yet. Create one above to automate your exports.
        </p>
      ) : (
        <div className="space-y-2">
          {center.schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span>{DESTINATION_META[s.destination].icon}</span>
                  <p className="truncate text-xs font-medium text-slate-700">
                    {TEMPLATE_META[s.templateId].label} → {DESTINATION_META[s.destination].label}
                  </p>
                  {s.enabled ? (
                    <StatusBadge label="Active" tone="success" />
                  ) : (
                    <StatusBadge label="Paused" tone="neutral" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{describeSchedule(s)}</p>
                {s.enabled && <p className="text-[11px] text-slate-400">Next run: {formatNextRun(s)}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => center.toggleSchedule(s.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  {s.enabled ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => center.removeSchedule(s.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
