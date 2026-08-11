export const DESTINATION_IDS = ["download", "email", "google-sheets", "dropbox", "onedrive"] as const;
export type DestinationId = (typeof DESTINATION_IDS)[number];

export interface DestinationMeta {
  id: DestinationId;
  label: string;
  icon: string;
  brandColor: string;
  description: string;
  requiresConnection: boolean;
}

export const DESTINATION_META: Record<DestinationId, DestinationMeta> = {
  download: {
    id: "download",
    label: "Download",
    icon: "⬇️",
    brandColor: "#4f46e5",
    description: "Save a CSV or PDF straight to this device",
    requiresConnection: false,
  },
  email: {
    id: "email",
    label: "Email",
    icon: "📧",
    brandColor: "#0ea5e9",
    description: "Send a report to yourself or someone else",
    requiresConnection: false,
  },
  "google-sheets": {
    id: "google-sheets",
    label: "Google Sheets",
    icon: "📗",
    brandColor: "#0f9d58",
    description: "Push a live spreadsheet to your Google Drive",
    requiresConnection: true,
  },
  dropbox: {
    id: "dropbox",
    label: "Dropbox",
    icon: "📦",
    brandColor: "#0061fe",
    description: "Keep a synced copy in your Dropbox",
    requiresConnection: true,
  },
  onedrive: {
    id: "onedrive",
    label: "OneDrive",
    icon: "☁️",
    brandColor: "#094ab2",
    description: "Keep a synced copy in Microsoft OneDrive",
    requiresConnection: true,
  },
};

export const TEMPLATE_IDS = ["tax-report", "monthly-summary", "category-analysis", "all-data"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  icon: string;
  description: string;
  bestFor: string;
}

export const TEMPLATE_META: Record<TemplateId, TemplateMeta> = {
  "tax-report": {
    id: "tax-report",
    label: "Tax Report",
    icon: "🧾",
    description: "Year-to-date expenses grouped by month, ready for your accountant",
    bestFor: "Tax season & bookkeeping",
  },
  "monthly-summary": {
    id: "monthly-summary",
    label: "Monthly Summary",
    icon: "🗓️",
    description: "This month's spending with a category breakdown",
    bestFor: "Budget check-ins",
  },
  "category-analysis": {
    id: "category-analysis",
    label: "Category Analysis",
    icon: "🧭",
    description: "All expenses grouped by category with subtotals",
    bestFor: "Spotting spending patterns",
  },
  "all-data": {
    id: "all-data",
    label: "Full Export",
    icon: "🗂️",
    description: "Every expense on record, unfiltered",
    bestFor: "Backups & migrations",
  },
};

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface ConnectionState {
  status: ConnectionStatus;
  accountLabel: string | null;
  lastSyncedAt: string | null;
}

export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface ScheduleEntry {
  id: string;
  templateId: TemplateId;
  destination: DestinationId;
  frequency: ScheduleFrequency;
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  enabled: boolean;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  templateId: TemplateId;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  templateId: TemplateId;
  destination: DestinationId;
  recordCount: number;
  totalAmount: number;
  status: "success" | "failed";
  detail: string | null;
}

export interface CloudExportState {
  connections: Record<DestinationId, ConnectionState>;
  schedules: ScheduleEntry[];
  shares: ShareLink[];
  history: HistoryEntry[];
}
