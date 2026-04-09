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
      <head>
        {/* Replace `ca-pub-8044806445812959` with your real Google AdSense publisher ID. */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8044806445812959" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
