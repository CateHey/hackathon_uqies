import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { DisclaimerFooter } from "@/components/disclaimer-banner";

export const metadata: Metadata = {
  title: "Free Me — Discover your path to financial freedom",
  description: "A personalised financial-freedom journey: one plan, two ways to experience it.",
};

export const viewport: Viewport = { themeColor: "#0f1720" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
