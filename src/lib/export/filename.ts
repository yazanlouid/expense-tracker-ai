import type { ExportFormat } from "./types";
import { EXPORT_FORMAT_META } from "./types";

export function defaultExportFilename(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  const stamp = local.toISOString().slice(0, 10);
  return `expenses-export-${stamp}`;
}

/** Strips characters that are illegal or awkward in filenames across OSes. */
export function sanitizeFilenameBase(raw: string): string {
  const trimmed = raw.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");
  return trimmed.length > 0 ? trimmed : defaultExportFilename();
}

export function buildFilename(base: string, format: ExportFormat): string {
  const clean = sanitizeFilenameBase(base);
  const withoutExtension = clean.replace(/\.[a-z0-9]+$/i, "");
  return `${withoutExtension}.${EXPORT_FORMAT_META[format].extension}`;
}
