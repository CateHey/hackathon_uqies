import type { Metadata } from "next";

/** The page itself is a client component, so its title lives here. */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to keep your Freedom Map across devices.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
