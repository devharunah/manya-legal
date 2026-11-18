import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Manya Legal | SME Legal Companion",
  description:
    "Plain-language, source-cited guidance on Ugandan business law for small businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
