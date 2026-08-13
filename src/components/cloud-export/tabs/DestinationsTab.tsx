"use client";

import { TEMPLATE_IDS, TEMPLATE_META, type TemplateId } from "@/lib/cloudExport/types";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import type { Expense } from "@/lib/types";
import CloudSyncCard from "../cards/CloudSyncCard";
import DownloadCard from "../cards/DownloadCard";
import EmailExportCard from "../cards/EmailExportCard";
import GoogleSheetsCard from "../cards/GoogleSheetsCard";

interface DestinationsTabProps {
  expenses: Expense[];
  center: ExportCenterState;
  selectedTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
}

export default function DestinationsTab({
  expenses,
  center,
  selectedTemplateId,
  onSelectTemplate,
}: DestinationsTabProps) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Send your export</h2>
          <p className="text-xs text-slate-400">Pick where this report should go.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Template
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value as TemplateId)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_META[id].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DownloadCard expenses={expenses} templateId={selectedTemplateId} center={center} />
        <EmailExportCard expenses={expenses} templateId={selectedTemplateId} center={center} />
        <GoogleSheetsCard expenses={expenses} templateId={selectedTemplateId} center={center} />
        <CloudSyncCard destination="dropbox" expenses={expenses} templateId={selectedTemplateId} center={center} />
        <CloudSyncCard destination="onedrive" expenses={expenses} templateId={selectedTemplateId} center={center} />
      </div>
    </div>
  );
}
