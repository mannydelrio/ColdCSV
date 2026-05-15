import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ColdCSV — Personalized Cold Emails at Scale",
  description:
    "Upload a CSV of sales prospects and get back AI-personalized cold email opening lines. Turn a full day of research into 10 minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
