/** Format a currency amount for display. Whole units only — the product never shows cents. */
export function formatMoney(amount: number, currency: string, opts: { compact?: boolean } = {}): string {
  const rounded = Math.round(amount);
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...(opts.compact ? { notation: "compact" as const } : {}),
    }).format(rounded);
  } catch {
    return `${currency} ${rounded.toLocaleString("en-AU")}`;
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
