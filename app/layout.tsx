import type { Metadata } from "next";
import "./globals.css";

function getDashboardUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const url = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return url.replace(/\/$/, "");
}

const dashboardUrl = getDashboardUrl();
const dashboardTitle = "সাতক্ষীরার আম ড্যাশবোর্ড";
const dashboardDescription =
  "সাতক্ষীরার আম ই-কমার্স অর্ডার, পণ্য ও কাস্টমার ম্যানেজমেন্ট ড্যাশবোর্ড।";
const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Satkhirar Amm dashboard",
};

export const metadata: Metadata = {
  metadataBase: new URL(dashboardUrl),
  title: dashboardTitle,
  description: dashboardDescription,
  applicationName: dashboardTitle,
  icons: {
    icon: [{ url: "/favicon.png", sizes: "512x512", type: "image/png" }],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: dashboardTitle,
    description: dashboardDescription,
    url: "/",
    siteName: dashboardTitle,
    locale: "bn_BD",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: dashboardTitle,
    description: dashboardDescription,
    images: [ogImage.url],
  },
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
