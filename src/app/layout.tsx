import type { Metadata } from "next";
import Script from "next/script";
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
      <body>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          // Replace `ca-pub-XXXXXXXXXX` with your real Google AdSense publisher ID.
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
