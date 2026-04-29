import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cristy's Recipes",
  description: "A warm personal recipe manager for family favorites."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
