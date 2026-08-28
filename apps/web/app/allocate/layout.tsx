import type { Metadata } from "next";

/** The page itself is a client component, so its title lives here. */
export const metadata: Metadata = {
  title: "Allocate",
  description: "Split an amount across your plan, with the reason behind every share.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
