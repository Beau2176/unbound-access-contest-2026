import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNBOUND Access — Paperwork by Voice",
  description: "One question, at your pace. Guided answers, source-linked corrections and a reviewable PDF. A fictional-form contest prototype.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
