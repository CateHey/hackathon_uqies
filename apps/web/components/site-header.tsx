"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";

const nav = [
  { href: "/map", label: "Map" },
  { href: "/learn", label: "Learn" },
  { href: "/allocate", label: "Allocate" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onPlan = pathname.startsWith("/map");
  const inOnboarding = pathname.startsWith("/onboarding");
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="whitespace-nowrap font-display text-xl tracking-wide text-parchment">
          🚀 Free Me
        </Link>
        {!inOnboarding && (
          <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Primary">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 transition ${pathname.startsWith(n.href) ? "bg-white/10 text-parchment" : "text-mist hover:text-parchment"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        {onPlan ? <ModeToggle /> : <span className="hidden text-xs text-mist sm:block">Discover your path to financial freedom.</span>}
      </div>
    </header>
  );
}
