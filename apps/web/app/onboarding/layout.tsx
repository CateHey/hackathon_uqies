import type { Metadata } from "next";

/** The page itself is a client component, so its title lives here. */
export const metadata: Metadata = {
  title: "Build your map",
  description: "Tell us what freedom means to you and we'll build your journey.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
