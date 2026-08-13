interface DeltaBadgeProps {
  /** Fractional change (0.25 === +25%), or null when there is no baseline. */
  change: number | null;
  /**
   * When true, a rise is rendered as unfavourable. Spending totals rising is
   * bad news; transaction counts are neutral.
   */
  riseIsBad?: boolean;
}

export default function DeltaBadge({ change, riseIsBad = true }: DeltaBadgeProps) {
  if (change === null) {
    return <span className="text-xs text-slate-400">No prior data</span>;
  }

  // Treat sub-0.5% drift as flat so rounding noise doesn't read as a trend.
  const isFlat = Math.abs(change) < 0.005;
  const isUp = change > 0;

  const tone = isFlat
    ? "bg-slate-100 text-slate-600"
    : isUp === riseIsBad
      ? "bg-red-50 text-red-700"
      : "bg-emerald-50 text-emerald-700";

  const arrow = isFlat ? "→" : isUp ? "↑" : "↓";
  const magnitude = Math.abs(change);
  // Runaway percentages (a category with a tiny baseline) are unreadable.
  const text = isFlat
    ? "No change"
    : magnitude >= 10
      ? `${arrow} >999%`
      : `${arrow} ${(magnitude * 100).toFixed(magnitude < 0.1 ? 1 : 0)}%`;

  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${tone}`}>
      {text}
    </span>
  );
}
