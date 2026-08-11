import type { ExpenseCategory } from "./types";

interface CategoryMeta {
  label: ExpenseCategory;
  color: string; // hex, used for charts
  badgeClass: string; // tailwind classes for pill badges
  icon: string; // emoji glyph, avoids extra icon dependency
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  Food: {
    label: "Food",
    color: "#f97316",
    badgeClass: "bg-orange-50 text-orange-700 ring-orange-600/20",
    icon: "🍔",
  },
  Transportation: {
    label: "Transportation",
    color: "#3b82f6",
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-600/20",
    icon: "🚗",
  },
  Entertainment: {
    label: "Entertainment",
    color: "#a855f7",
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-600/20",
    icon: "🎬",
  },
  Shopping: {
    label: "Shopping",
    color: "#ec4899",
    badgeClass: "bg-pink-50 text-pink-700 ring-pink-600/20",
    icon: "🛍️",
  },
  Bills: {
    label: "Bills",
    color: "#14b8a6",
    badgeClass: "bg-teal-50 text-teal-700 ring-teal-600/20",
    icon: "🧾",
  },
  Other: {
    label: "Other",
    color: "#64748b",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-600/20",
    icon: "📦",
  },
};
