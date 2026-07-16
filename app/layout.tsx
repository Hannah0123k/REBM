import type { Metadata } from "next";
import "./globals.css";

// PROVISIONAL — meta comes from the live site per CLAUDE.md. Replace once the
// content crawl reports the real title/description.
export const metadata: Metadata = {
  title: "Real Estate Broker Match",
  description:
    "Real Estate Broker Match (REBM) will match you with a real estate broker from our nationwide network of 40,000 brokers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
