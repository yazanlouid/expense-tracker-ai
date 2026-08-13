/**
 * Every "cloud" integration in this app is a local simulation — there's no
 * backend to actually call. This module centralizes that pretend latency so
 * every card feels consistent, and keeps the fakery in one obvious place.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withStagedProgress(ms: number, onProgress: (pct: number) => void): Promise<void> {
  const steps = 8;
  const stepDelay = ms / steps;
  for (let i = 1; i <= steps; i++) {
    await delay(stepDelay);
    onProgress(Math.round((i / steps) * 100));
  }
}

export function randomToken(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
