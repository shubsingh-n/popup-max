import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poptin MVP - Popup & Lead Capture Platform",
  description: "Create and manage popups with lead capture functionality",
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

