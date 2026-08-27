import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-soft shadow-[0_0_0_1px_rgba(201,162,39,0.4)]",
  secondary: "border border-white/15 text-parchment hover:bg-white/5",
  ghost: "text-mist hover:text-parchment hover:bg-white/5",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-ink-soft/70 p-5 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-3">
      {eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-mist">{eyebrow}</p>}
      <h2 className="font-display text-2xl text-parchment">{children}</h2>
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="tracking-wider text-gold" aria-label={`${v} out of 5`}>
      {"★".repeat(v)}
      <span className="text-white/20">{"☆".repeat(5 - v)}</span>
    </span>
  );
}

const badgeColors: Record<string, string> = {
  locked: "bg-white/5 text-mist",
  available: "bg-white/10 text-parchment",
  active: "bg-gold/20 text-gold",
  complete: "bg-success/20 text-success",
  todo: "bg-white/5 text-mist",
  in_progress: "bg-gold/20 text-gold",
  done: "bg-success/20 text-success",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeColors[status] ?? "bg-white/5 text-mist"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm text-mist">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-mist/40 border-t-gold" />
      {label}
    </span>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-parchment">{children}</p>;
}
