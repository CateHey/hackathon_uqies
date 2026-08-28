import type { Metadata } from "next";

/** The page itself is a client component, so its title lives here. */
export const metadata: Metadata = {
  title: "Your Freedom Map",
  description: "Your financial journey as a map you can actually see, understand and follow.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
