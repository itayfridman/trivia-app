import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Trivia",
  description: "One question at a time. 100 levels of challenge.",
  applicationName: "Daily Trivia",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
