import type { Expense } from "@/lib/types";
import type { TemplateId } from "./types";

export interface AppliedTemplate {
  expenses: Expense[];
  title: string;
  filenameBase: string;
  grouped: boolean;
}

function currentYear(): number {
  return new Date().getFullYear();
}

function monthLabel(reference = new Date()): string {
  return reference.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function applyTemplate(templateId: TemplateId, expenses: Expense[]): AppliedTemplate {
  const sorted = [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  switch (templateId) {
    case "tax-report": {
      const year = currentYear();
      const yearExpenses = sorted.filter((e) => e.date.startsWith(String(year)));
      return {
        expenses: yearExpenses,
        title: `Tax Report — ${year}`,
        filenameBase: `tax-report-${year}`,
        grouped: false,
      };
    }
    case "monthly-summary": {
      const now = new Date();
      const key = now.toISOString().slice(0, 7);
      const monthExpenses = sorted.filter((e) => e.date.startsWith(key));
      return {
        expenses: monthExpenses,
        title: `Monthly Summary — ${monthLabel(now)}`,
        filenameBase: `monthly-summary-${key}`,
        grouped: false,
      };
    }
    case "category-analysis": {
      const byCategory = [...sorted].sort((a, b) => a.category.localeCompare(b.category));
      return {
        expenses: byCategory,
        title: "Category Analysis — All Time",
        filenameBase: "category-analysis",
        grouped: true,
      };
    }
    case "all-data":
    default:
      return {
        expenses: sorted,
        title: "Full Export — All Time",
        filenameBase: "expenses-full-export",
        grouped: false,
      };
  }
}
