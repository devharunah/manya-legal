import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";

import { SessionProvider } from "@/components/app/session";
import { HtmlLang } from "@/components/html-lang";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
// Only the dispute report preview uses the serif.
const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", preload: false });

export const metadata: Metadata = {
  title: "MANYA | Commercial Justice Companion",
  description:
    "Report a supplier dispute in Luganda or English, organise your evidence, and find the right way to resolve it. Hack4Justice 2026.",
};

export const viewport: Viewport = {
  themeColor: "#2b1248", // --brand-900
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body>
        <SessionProvider>
          <TooltipProvider delayDuration={300}>
            <HtmlLang />
            {children}
            <Toaster />
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
