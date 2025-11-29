import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Verifier - AI-Powered Identity Verification",
  description: "Verify passports, visas, national IDs, and travel documents with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
