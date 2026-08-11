"use client";

import { useCallback, useMemo, useReducer } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { Expense } from "@/lib/types";
import { buildExportBlob } from "./buildExport";
import { downloadBlob } from "./download";
import { applyExportFilters, sumAmount } from "./filter";
import { buildFilename, defaultExportFilename } from "./filename";
import type { ExportFilterState, ExportFormat } from "./types";

type Status = "idle" | "exporting" | "success" | "error";

interface State {
  format: ExportFormat;
  filters: ExportFilterState;
  filenameBase: string;
  status: Status;
  errorMessage: string | null;
  lastExportedFilename: string | null;
}

type Action =
  | { type: "RESET" }
  | { type: "SET_FORMAT"; format: ExportFormat }
  | { type: "SET_START_DATE"; value: string }
  | { type: "SET_END_DATE"; value: string }
  | { type: "TOGGLE_CATEGORY"; category: Expense["category"] }
  | { type: "SET_ALL_CATEGORIES"; selected: boolean }
  | { type: "SET_FILENAME"; value: string }
  | { type: "RESET_FILTERS" }
  | { type: "EXPORT_START" }
  | { type: "EXPORT_SUCCESS"; filename: string }
  | { type: "EXPORT_ERROR"; message: string };

function initialState(): State {
  return {
    format: "csv",
    filters: { startDate: "", endDate: "", categories: [...EXPENSE_CATEGORIES] },
    filenameBase: defaultExportFilename(),
    status: "idle",
    errorMessage: null,
    lastExportedFilename: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return initialState();
    case "SET_FORMAT":
      return { ...state, format: action.format, status: "idle", errorMessage: null };
    case "SET_START_DATE":
      return { ...state, filters: { ...state.filters, startDate: action.value }, status: "idle" };
    case "SET_END_DATE":
      return { ...state, filters: { ...state.filters, endDate: action.value }, status: "idle" };
    case "TOGGLE_CATEGORY": {
      const has = state.filters.categories.includes(action.category);
      const categories = has
        ? state.filters.categories.filter((c) => c !== action.category)
        : [...state.filters.categories, action.category];
      return { ...state, filters: { ...state.filters, categories }, status: "idle" };
    }
    case "SET_ALL_CATEGORIES":
      return {
        ...state,
        filters: { ...state.filters, categories: action.selected ? [...EXPENSE_CATEGORIES] : [] },
        status: "idle",
      };
    case "SET_FILENAME":
      return { ...state, filenameBase: action.value };
    case "RESET_FILTERS":
      return {
        ...state,
        filters: { startDate: "", endDate: "", categories: [...EXPENSE_CATEGORIES] },
      };
    case "EXPORT_START":
      return { ...state, status: "exporting", errorMessage: null };
    case "EXPORT_SUCCESS":
      return { ...state, status: "success", lastExportedFilename: action.filename };
    case "EXPORT_ERROR":
      return { ...state, status: "error", errorMessage: action.message };
    default:
      return state;
  }
}

export function useExportDialog(expenses: Expense[]) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const filteredExpenses = useMemo(
    () => applyExportFilters(expenses, state.filters),
    [expenses, state.filters]
  );

  const totalAmount = useMemo(() => sumAmount(filteredExpenses), [filteredExpenses]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const setFormat = useCallback((format: ExportFormat) => dispatch({ type: "SET_FORMAT", format }), []);
  const setStartDate = useCallback((value: string) => dispatch({ type: "SET_START_DATE", value }), []);
  const setEndDate = useCallback((value: string) => dispatch({ type: "SET_END_DATE", value }), []);
  const toggleCategory = useCallback(
    (category: Expense["category"]) => dispatch({ type: "TOGGLE_CATEGORY", category }),
    []
  );
  const setAllCategories = useCallback(
    (selected: boolean) => dispatch({ type: "SET_ALL_CATEGORIES", selected }),
    []
  );
  const setFilenameBase = useCallback((value: string) => dispatch({ type: "SET_FILENAME", value }), []);
  const resetFilters = useCallback(() => dispatch({ type: "RESET_FILTERS" }), []);

  const runExport = useCallback(async () => {
    if (filteredExpenses.length === 0) return;
    dispatch({ type: "EXPORT_START" });
    try {
      // Give the UI a frame to paint the loading state, and let PDF generation
      // (which can take real time for larger reports) run without blocking it.
      await new Promise((resolve) => setTimeout(resolve, 350));
      const blob = buildExportBlob(state.format, filteredExpenses, state.filters);
      const filename = buildFilename(state.filenameBase, state.format);
      downloadBlob(filename, blob);
      dispatch({ type: "EXPORT_SUCCESS", filename });
    } catch (err) {
      dispatch({ type: "EXPORT_ERROR", message: err instanceof Error ? err.message : "Export failed." });
    }
  }, [filteredExpenses, state.format, state.filters, state.filenameBase]);

  return {
    ...state,
    filteredExpenses,
    totalAmount,
    reset,
    setFormat,
    setStartDate,
    setEndDate,
    toggleCategory,
    setAllCategories,
    setFilenameBase,
    resetFilters,
    runExport,
  };
}
