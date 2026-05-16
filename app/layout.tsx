import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "সাতক্ষীরার আম ড্যাশবোর্ড",
  description: "সাতক্ষীরার আম ই-কমার্স অ্যাডমিন ড্যাশবোর্ড",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
