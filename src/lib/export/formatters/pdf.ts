import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import type { ExportFilterState } from "../types";

function describeRange(filters: ExportFilterState): string {
  if (filters.startDate && filters.endDate) return `${filters.startDate} to ${filters.endDate}`;
  if (filters.startDate) return `From ${filters.startDate}`;
  if (filters.endDate) return `Through ${filters.endDate}`;
  return "All time";
}

export function buildPDF(expenses: Expense[], filters: ExportFilterState): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("Expense Report", 40, 48);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 40, 66);
  doc.text(`Range: ${describeRange(filters)}`, 40, 80);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${expenses.length} record${expenses.length === 1 ? "" : "s"}`, 40, 102);
  doc.text(`Total: ${formatCurrency(totalAmount)}`, 200, 102);

  autoTable(doc, {
    startY: 118,
    head: [["Date", "Category", "Amount", "Description"]],
    body: expenses.map((e) => [e.date, e.category, formatCurrency(e.amount), e.description]),
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  return doc.output("blob");
}
