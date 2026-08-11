"use client";

import { useState } from "react";
import { applyTemplate } from "@/lib/cloudExport/templates";
import { delay } from "@/lib/cloudExport/simulate";
import { DESTINATION_META, TEMPLATE_META, type TemplateId } from "@/lib/cloudExport/types";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface EmailExportCardProps {
  expenses: Expense[];
  templateId: TemplateId;
  center: ExportCenterState;
}

type Phase = "idle" | "composing" | "sending" | "sent";

export default function EmailExportCard({ expenses, templateId, center }: EmailExportCardProps) {
  const meta = DESTINATION_META.email;
  const [phase, setPhase] = useState<Phase>("idle");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("Here's the expense report you asked for.");

  const applied = applyTemplate(templateId, expenses);
  const total = applied.expenses.reduce((sum, e) => sum + e.amount, 0);
  const subject = `${TEMPLATE_META[templateId].label} — ${applied.expenses.length} expenses`;

  async function handleSend() {
    if (!recipient.trim()) return;
    setPhase("sending");
    await delay(1100);
    setPhase("sent");
    center.addHistoryEntry({
      templateId,
      destination: "email",
      recordCount: applied.expenses.length,
      totalAmount: total,
      status: "success",
      detail: `Sent to ${recipient.trim()}`,
    });
  }

  function reset() {
    setPhase("idle");
    setRecipient("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
          <p className="text-[11px] text-slate-400">{meta.description}</p>
        </div>
      </div>

      {phase === "idle" && (
        <button
          onClick={() => setPhase("composing")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Compose email
        </button>
      )}

      {(phase === "composing" || phase === "sending") && (
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">To</span>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name@example.com"
              disabled={phase === "sending"}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Subject</span>
            <input
              readOnly
              value={subject}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={phase === "sending"}
              rows={2}
              className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <button
            onClick={handleSend}
            disabled={!recipient.trim() || phase === "sending"}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {phase === "sending" ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending…
              </>
            ) : (
              `Send to ${recipient.trim() || "recipient"}`
            )}
          </button>
        </div>
      )}

      {phase === "sent" && (
        <div>
          <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-[11px] text-slate-400">Preview</p>
            <p className="text-xs font-semibold text-slate-700">{subject}</p>
            <p className="mb-1 text-[11px] text-slate-500">To: {recipient}</p>
            <p className="text-[11px] text-slate-500">{message}</p>
            <p className="mt-2 border-t border-dashed border-slate-300 pt-2 text-[11px] text-slate-400">
              📎 {applied.filenameBase}.pdf — {applied.expenses.length} records, {formatCurrency(total)}
            </p>
          </div>
          <p className="mb-2 text-[11px] font-medium text-emerald-600">Sent (simulated) ✓</p>
          <button onClick={reset} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
            Send another
          </button>
        </div>
      )}
    </div>
  );
}
