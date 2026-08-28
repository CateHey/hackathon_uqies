/**
 * SVG has no text wrapping and no overflow clipping: a <text> longer than its box simply
 * draws past the edge. Region titles come from the model, so their length is not ours to
 * control — every string drawn inside a node goes through these helpers first.
 *
 * Widths are estimated, not measured: measuring would need a DOM pass per node and would
 * differ between the server render and the client. The ratios below are the average glyph
 * advance for the UI faces at map sizes, rounded up so the estimate errs towards truncating.
 */

/** Average glyph advance as a fraction of font size. Uppercase runs wider than mixed case. */
const ADVANCE = { mixed: 0.58, upper: 0.66 } as const;

/** How many characters of `text` fit in `maxWidth` at this size. */
export function charsThatFit(
  maxWidth: number,
  fontSize: number,
  { upper = false, letterSpacing = 0 }: { upper?: boolean; letterSpacing?: number } = {},
): number {
  const perChar = fontSize * ADVANCE[upper ? "upper" : "mixed"] + fontSize * letterSpacing;
  return Math.max(1, Math.floor(maxWidth / perChar));
}

/** `text` trimmed to `maxWidth`, with an ellipsis when something was cut. */
export function fitText(
  text: string,
  maxWidth: number,
  fontSize: number,
  opts: { upper?: boolean; letterSpacing?: number } = {},
): string {
  const limit = charsThatFit(maxWidth, fontSize, opts);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

/** Wrap a short title into at most `maxLines` lines of roughly `maxChars` characters for SVG <text>. */
export function wrapTitle(title: string, maxChars = 18, maxLines = 2): string[] {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.slice(0, maxChars - 1)}…`;
    return kept;
  }
  // A single word longer than the line still overflows — clip it to the same budget.
  return lines.map((line) => (line.length <= maxChars ? line : `${line.slice(0, maxChars - 1)}…`));
}

/** Wrap a title to the pixel width actually available inside a node. */
export function wrapTitleToWidth(title: string, maxWidth: number, fontSize: number, maxLines = 2): string[] {
  return wrapTitle(title, charsThatFit(maxWidth, fontSize), maxLines);
}
