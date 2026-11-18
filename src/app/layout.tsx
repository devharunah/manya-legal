import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Manya Legal | SME Legal Companion",
  description:
    "Plain-language, source-cited guidance on Ugandan business law for small businesses. Hack4Justice 2026.",
};

export const viewport: Viewport = {
  themeColor: "#2e1239",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
