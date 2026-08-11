import { CATEGORY_META } from "@/lib/categories";
import type { ExpenseCategory } from "@/lib/types";

export default function CategoryBadge({ category }: { category: ExpenseCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badgeClass}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
