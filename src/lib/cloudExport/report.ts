import jsPDF from "jspdf";
import autoTable, { type CellInput } from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import type { AppliedTemplate } from "./templates";

function escapeCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function groupByCategory(expenses: Expense[]): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const bucket = map.get(e.category) ?? [];
    bucket.push(e);
    map.set(e.category, bucket);
  }
  return map;
}

export function buildReportCSV(applied: AppliedTemplate): Blob {
  const columns = ["Date", "Category", "Amount", "Description"];
  const rows: (string | number)[][] = [columns];

  if (applied.grouped) {
    for (const [category, group] of Array.from(groupByCategory(applied.expenses))) {
      for (const e of group) {
        rows.push([e.date, e.category, e.amount.toFixed(2), e.description]);
      }
      const subtotal = group.reduce((sum, e) => sum + e.amount, 0);
      rows.push([`${category} subtotal`, "", subtotal.toFixed(2), ""]);
    }
  } else {
    for (const e of applied.expenses) {
      rows.push([e.date, e.category, e.amount.toFixed(2), e.description]);
    }
  }

  const total = applied.expenses.reduce((sum, e) => sum + e.amount, 0);
  rows.push(["Total", "", total.toFixed(2), ""]);

  const text = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
  return new Blob([text], { type: "text/csv;charset=utf-8;" });
}

export function buildReportPDF(applied: AppliedTemplate): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const total = applied.expenses.reduce((sum, e) => sum + e.amount, 0);

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(applied.title, 40, 48);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 40, 66);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${applied.expenses.length} record${applied.expenses.length === 1 ? "" : "s"}`, 40, 86);
  doc.text(`Total: ${formatCurrency(total)}`, 200, 86);

  const body: CellInput[][] = [];
  if (applied.grouped) {
    for (const [category, group] of Array.from(groupByCategory(applied.expenses))) {
      for (const e of group) {
        body.push([e.date, e.category, formatCurrency(e.amount), e.description]);
      }
      const subtotal = group.reduce((sum, e) => sum + e.amount, 0);
      body.push([{ content: `${category} subtotal`, styles: { fontStyle: "bold" } }, "", formatCurrency(subtotal), ""]);
    }
  } else {
    for (const e of applied.expenses) {
      body.push([e.date, e.category, formatCurrency(e.amount), e.description]);
    }
  }

  autoTable(doc, {
    startY: 102,
    head: [["Date", "Category", "Amount", "Description"]],
    body,
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  return doc.output("blob");
}

export function buildReportBlob(format: "csv" | "pdf", applied: AppliedTemplate): Blob {
  return format === "csv" ? buildReportCSV(applied) : buildReportPDF(applied);
}
