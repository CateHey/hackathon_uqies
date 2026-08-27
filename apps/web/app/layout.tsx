import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Me — Discover your path to financial freedom",
  description: "A personalised financial-freedom journey: one plan, two ways to experience it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
