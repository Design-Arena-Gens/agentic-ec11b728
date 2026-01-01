import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class 12 Notes Exporter",
  description: "Fetch class 12 notes and export them into a Word document",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
