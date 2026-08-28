/**
 * How plan statuses are worded and coloured in the UI.
 *
 * The map is a guide, not a gate: nothing is ever presented as locked. A region the
 * plan hasn't opened yet is "Pending" — you can still open it, read it, and fill it in.
 */

export type AnyStatus = "locked" | "available" | "active" | "complete" | "unlocked" | "todo" | "in_progress" | "done";

const LABELS: Record<AnyStatus, string> = {
  // regions
  locked: "Pending",
  available: "Ready",
  active: "In focus",
  complete: "Complete",
  // bridges
  unlocked: "Open",
  // steps
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const CLASSES: Record<AnyStatus, string> = {
  locked: "bg-white/5 text-mist",
  available: "bg-white/10 text-parchment",
  active: "bg-accent/20 text-accent-soft",
  complete: "bg-accent-2/20 text-accent-2",
  unlocked: "bg-accent/15 text-accent-soft",
  todo: "bg-white/5 text-mist",
  in_progress: "bg-accent/20 text-accent-soft",
  done: "bg-accent-2/20 text-accent-2",
};

export function statusLabel(status: string): string {
  return LABELS[status as AnyStatus] ?? status.replace("_", " ");
}

export function statusClass(status: string): string {
  return CLASSES[status as AnyStatus] ?? "bg-white/5 text-mist";
}

/** Wording for what has to happen before the plan suggests a path — never "unlocks". */
export function opensWhen(requirement: string): string {
  return `Suggested next: ${requirement}`;
}
