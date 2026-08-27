/** Whole months from `from` until the ISO date `toIso` (YYYY-MM-DD). Never negative; 0 for invalid or past dates. */
export function monthsBetween(from: Date, toIso: string): number {
  const to = new Date(`${toIso}T00:00:00Z`);
  if (Number.isNaN(to.getTime())) return 0;
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth()) -
    (to.getUTCDate() < from.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
