"use client";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-500",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  danger: "bg-red-50 text-red-700",
};

const DOT_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-red-500",
};

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  pulse?: boolean;
}

export default function StatusBadge({ label, tone = "neutral", pulse }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
