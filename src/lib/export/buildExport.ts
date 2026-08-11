import type { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { buildCSV } from "./formatters/csv";
import { buildJSON } from "./formatters/json";
import { buildPDF } from "./formatters/pdf";
import type { ExportFilterState, ExportFormat } from "./types";

export function buildExportBlob(format: ExportFormat, expenses: Expense[], filters: ExportFilterState): Blob {
  switch (format) {
    case "csv":
      return buildCSV(expenses);
    case "json":
      return buildJSON(expenses, filters, EXPENSE_CATEGORIES.length);
    case "pdf":
      return buildPDF(expenses, filters);
  }
}
