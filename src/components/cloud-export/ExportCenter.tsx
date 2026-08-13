"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/lib/types";
import { useExportCenterState } from "@/lib/cloudExport/storage";
import type { TemplateId } from "@/lib/cloudExport/types";
import DestinationsTab from "./tabs/DestinationsTab";
import HistoryTab from "./tabs/HistoryTab";
import OverviewTab from "./tabs/OverviewTab";
import ScheduleTab from "./tabs/ScheduleTab";
import ShareTab from "./tabs/ShareTab";
import TemplatesTab from "./tabs/TemplatesTab";

interface ExportCenterProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "templates", label: "Templates", icon: "🧩" },
  { id: "destinations", label: "Destinations", icon: "🔗" },
  { id: "schedule", label: "Schedule", icon: "⏰" },
  { id: "share", label: "Share", icon: "🔗" },
  { id: "history", label: "History", icon: "📜" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function ExportCenter({ isOpen, onClose, expenses }: ExportCenterProps) {
  const center = useExportCenterState();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("all-data");

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function goToDestinations(templateId: TemplateId) {
    setSelectedTemplateId(templateId);
    setActiveTab("destinations");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/60 p-0 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-center-title"
        className="export-center-panel relative flex w-full max-w-5xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M5.5 16a4.5 4.5 0 01-.5-8.98 5.5 5.5 0 0110.62-1.63A4 4 0 0116 13.9v.1H5.5v-.02A.5.5 0 015.5 16z" />
              </svg>
            </span>
            <div>
              <h1 id="export-center-title" className="text-base font-semibold text-slate-900">
                Export Center
              </h1>
              <p className="text-xs text-slate-400">Templates, integrations, schedules & sharing — all in one place</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 sm:w-48 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-700">
              <span aria-hidden="true">ℹ️</span>
              <span>
                Demo mode: everything here runs locally in your browser. Cloud connections, email delivery, and
                sync are simulated so you can see the full flow — no data ever leaves this device.
              </span>
            </div>

            {activeTab === "overview" && (
              <OverviewTab expenses={expenses} center={center} onNavigate={setActiveTab} />
            )}
            {activeTab === "templates" && (
              <TemplatesTab
                expenses={expenses}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={setSelectedTemplateId}
                onUseTemplate={goToDestinations}
              />
            )}
            {activeTab === "destinations" && (
              <DestinationsTab
                expenses={expenses}
                center={center}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={setSelectedTemplateId}
              />
            )}
            {activeTab === "schedule" && (
              <ScheduleTab center={center} selectedTemplateId={selectedTemplateId} />
            )}
            {activeTab === "share" && <ShareTab center={center} selectedTemplateId={selectedTemplateId} />}
            {activeTab === "history" && <HistoryTab center={center} expenses={expenses} />}
          </div>
        </div>
      </div>
    </div>
  );
}
