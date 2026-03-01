import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bawk — Social Skills Practice",
  description: "Practice social goals with fun activities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
