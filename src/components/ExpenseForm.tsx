"use client";

import { useState, type FormEvent } from "react";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseInput } from "@/lib/types";
import { todayISO } from "@/lib/utils";

interface ExpenseFormProps {
  initialValue?: Expense | null;
  onSubmit: (input: ExpenseInput) => void;
  onCancel: () => void;
}

interface FormState {
  date: string;
  amount: string;
  category: ExpenseInput["category"];
  description: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function toFormState(expense?: Expense | null): FormState {
  if (!expense) {
    return { date: todayISO(), amount: "", category: "Food", description: "" };
  }
  return {
    date: expense.date,
    amount: String(expense.amount),
    category: expense.category,
    description: expense.description,
  };
}

export default function ExpenseForm({ initialValue, onSubmit, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditing = Boolean(initialValue);

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {};

    if (!values.date) {
      next.date = "Date is required.";
    }

    const amountNum = Number(values.amount);
    if (!values.amount.trim()) {
      next.amount = "Amount is required.";
    } else if (Number.isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Enter a valid amount greater than 0.";
    } else if (amountNum > 1_000_000) {
      next.amount = "Amount seems too large.";
    }

    if (!values.category) {
      next.category = "Category is required.";
    }

    if (!values.description.trim()) {
      next.description = "Description is required.";
    } else if (values.description.trim().length < 2) {
      next.description = "Description must be at least 2 characters.";
    } else if (values.description.trim().length > 200) {
      next.description = "Description must be under 200 characters.";
    }

    return next;
  }

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      date: form.date,
      amount: Math.round(Number(form.amount) * 100) / 100,
      category: form.category,
      description: form.description.trim(),
    });
  }

  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";
  const errorRing = "border-red-300 focus:ring-red-500/40 focus:border-red-500";
  const okRing = "border-slate-300";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            max={todayISO()}
            onChange={(e) => handleChange("date", e.target.value)}
            className={`${inputBase} ${errors.date ? errorRing : okRing}`}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "date-error" : undefined}
          />
          {errors.date && (
            <p id="date-error" className="mt-1 text-xs text-red-600">
              {errors.date}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              $
            </span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className={`${inputBase} pl-6 ${errors.amount ? errorRing : okRing}`}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
          </div>
          {errors.amount && (
            <p id="amount-error" className="mt-1 text-xs text-red-600">
              {errors.amount}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value as FormState["category"])}
          className={`${inputBase} ${errors.category ? errorRing : okRing}`}
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <input
          id="description"
          type="text"
          placeholder="e.g. Weekly grocery run"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={`${inputBase} ${errors.description ? errorRing : okRing}`}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-xs text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          {isEditing ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
