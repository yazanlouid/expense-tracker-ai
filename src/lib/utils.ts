export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * A Date's *local* calendar day as YYYY-MM-DD. Calling `toISOString()` directly
 * would give the UTC day, which is the previous one between midnight and 01:00
 * BST — enough to file an expense under the wrong day, or the wrong month when
 * that day is the 1st.
 */
export function toISODate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // YYYY-MM
}

export function isSameMonth(isoDate: string, reference: Date = new Date()): boolean {
  return monthKey(isoDate) === monthKey(toISODate(reference));
}
