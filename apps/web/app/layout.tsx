import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { BRAND } from "@free-me/core";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { DisclaimerFooter } from "@/components/disclaimer-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Set your goals, and PAYF works out what to put aside each month — and what it would actually take to get there.",
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪙</text></svg>" },
};

export const viewport: Viewport = { themeColor: "#0b1014" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <DisclaimerFooter />
        </Providers>
      </body>
    </html>
  );
}
