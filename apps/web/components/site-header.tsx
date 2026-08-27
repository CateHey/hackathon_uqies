"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { AUTH_ENABLED, useUser } from "@/lib/use-user";

const nav = [
  { href: "/map", label: "Map" },
  { href: "/learn", label: "Learn" },
  { href: "/allocate", label: "Allocate" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useUser();
  const onPlan = pathname.startsWith("/map");
  const inOnboarding = pathname.startsWith("/onboarding");

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="whitespace-nowrap font-display text-xl font-semibold tracking-wide text-parchment">
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
        <div className="flex items-center gap-2">
          {onPlan && <ModeToggle />}
          {AUTH_ENABLED && user !== undefined && (
            user ? (
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/");
                  router.refresh();
                }}
                className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-mist hover:text-parchment sm:block"
                title={user.email ?? "Signed in"}
              >
                {user.email ? user.email.split("@")[0] : "Account"} · Sign out
              </button>
            ) : (
              <Link href="/login" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-mist hover:text-parchment">
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
