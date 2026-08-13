"use client";

import { useEffect, useState } from "react";
import type { ExportCenterState } from "@/lib/cloudExport/storage";
import { generateQRDataUrl } from "@/lib/cloudExport/qrcode";
import { randomToken } from "@/lib/cloudExport/simulate";
import { TEMPLATE_IDS, TEMPLATE_META, type TemplateId } from "@/lib/cloudExport/types";
import type { ShareLink } from "@/lib/cloudExport/types";

interface ShareTabProps {
  center: ExportCenterState;
  selectedTemplateId: TemplateId;
}

type Expiration = "7" | "30" | "never";

function shareUrl(token: string): string {
  return `https://expensetracker.app/shared/${token}`;
}

function expiresAtFrom(option: Expiration): string | null {
  if (option === "never") return null;
  const days = Number(option);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isExpired(link: ShareLink): boolean {
  return Boolean(link.expiresAt && new Date(link.expiresAt) < new Date());
}

export default function ShareTab({ center, selectedTemplateId }: ShareTabProps) {
  const [templateId, setTemplateId] = useState<TemplateId>(selectedTemplateId);
  const [expiration, setExpiration] = useState<Expiration>("7");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const missing = center.shares.filter((s) => !qrCodes[s.id]);
    if (missing.length === 0) return;
    missing.forEach(async (s) => {
      const dataUrl = await generateQRDataUrl(shareUrl(s.token));
      setQrCodes((prev) => ({ ...prev, [s.id]: dataUrl }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.shares]);

  function handleCreate() {
    center.addShare({ token: randomToken(), templateId, expiresAt: expiresAtFrom(expiration) });
  }

  async function handleCopy(link: ShareLink) {
    try {
      await navigator.clipboard.writeText(shareUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard API may be unavailable; the link is still visible to copy manually.
    }
  }

  const activeLinks = center.shares.filter((s) => !s.revoked);

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-slate-800">Share a report</h2>
      <p className="mb-4 text-xs text-slate-400">
        Generate a link (and QR code) someone could scan to view a snapshot of this report.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_META[id].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium uppercase tracking-wide text-slate-400">Expires</span>
          <select
            value={expiration}
            onChange={(e) => setExpiration(e.target.value as Expiration)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="7">In 7 days</option>
            <option value="30">In 30 days</option>
            <option value="never">Never</option>
          </select>
        </label>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          Generate link
        </button>
      </div>

      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Active links ({activeLinks.length})
      </h3>

      {activeLinks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
          No share links yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeLinks.map((link) => {
            const expired = isExpired(link);
            return (
              <div key={link.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                {qrCodes[link.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodes[link.id]} alt="QR code" className="h-20 w-20 shrink-0 rounded-md border border-slate-100" />
                ) : (
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-md bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">{TEMPLATE_META[link.templateId].label}</p>
                  <p className="truncate text-[11px] text-slate-400">{shareUrl(link.token)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {expired ? (
                      <span className="text-red-500">Expired</span>
                    ) : link.expiresAt ? (
                      `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                    ) : (
                      "Never expires"
                    )}
                  </p>
                  <p className="text-[11px] text-slate-300">0 views · demo link, not publicly reachable</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleCopy(link)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy link"}
                    </button>
                    <button
                      onClick={() => center.revokeShare(link.id)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
