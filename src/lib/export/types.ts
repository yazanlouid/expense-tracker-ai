import type { Expense, ExpenseCategory } from "@/lib/types";

export const EXPORT_FORMATS = ["csv", "json", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface ExportFormatMeta {
  id: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
}

export const EXPORT_FORMAT_META: Record<ExportFormat, ExportFormatMeta> = {
  csv: {
    id: "csv",
    label: "CSV",
    extension: "csv",
    mimeType: "text/csv;charset=utf-8;",
    description: "Spreadsheet-friendly, opens in Excel or Sheets",
  },
  json: {
    id: "json",
    label: "JSON",
    extension: "json",
    mimeType: "application/json;charset=utf-8;",
    description: "Structured data for developers & integrations",
  },
  pdf: {
    id: "pdf",
    label: "PDF",
    extension: "pdf",
    mimeType: "application/pdf",
    description: "Formatted report, ready to print or share",
  },
};

export interface ExportFilterState {
  startDate: string;
  endDate: string;
  categories: ExpenseCategory[];
}

export interface ExportRequest {
  format: ExportFormat;
  filename: string;
  filters: ExportFilterState;
}

export interface ExportResult {
  filename: string;
  recordCount: number;
  totalAmount: number;
}

export type ExportableExpense = Expense;
