import type { ScheduleEntry } from "./types";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function describeSchedule(entry: ScheduleEntry): string {
  switch (entry.frequency) {
    case "daily":
      return `Every day at ${entry.time}`;
    case "weekly":
      return `Every ${DAY_LABELS[entry.dayOfWeek]} at ${entry.time}`;
    case "monthly":
      return `Day ${entry.dayOfMonth} of every month at ${entry.time}`;
  }
}

export function computeNextRun(entry: ScheduleEntry, now = new Date()): Date {
  const [hours, minutes] = entry.time.split(":").map(Number);
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  if (entry.frequency === "daily") {
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  if (entry.frequency === "weekly") {
    let diff = (entry.dayOfWeek - candidate.getDay() + 7) % 7;
    if (diff === 0 && candidate <= now) diff = 7;
    candidate.setDate(candidate.getDate() + diff);
    return candidate;
  }

  // monthly
  candidate.setDate(Math.min(entry.dayOfMonth, 28));
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1);
    candidate.setDate(Math.min(entry.dayOfMonth, 28));
  }
  return candidate;
}

export function formatNextRun(entry: ScheduleEntry): string {
  const next = computeNextRun(entry);
  return next.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
