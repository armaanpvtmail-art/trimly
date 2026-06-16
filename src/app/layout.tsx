import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { clientEnv } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const appName = clientEnv.NEXT_PUBLIC_APP_NAME;
const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — Premium URL Shortener`,
    template: `%s · ${appName}`,
  },
  description:
    "Trimly turns long links into beautiful, themed short links with real-time analytics, custom redirect experiences, and lightning-fast performance.",
  keywords: [
    "url shortener",
    "link management",
    "branded links",
    "link analytics",
    "themed redirects",
  ],
  applicationName: appName,
  authors: [{ name: appName }],
  openGraph: {
    type: "website",
    siteName: appName,
    title: `${appName} — Premium URL Shortener`,
    description:
      "Beautiful themed short links with real-time analytics. Unlimited links for ₹90/month.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Premium URL Shortener`,
    description: "Beautiful themed short links with real-time analytics.",
  },
  icons: { icon: "/favicon.ico", apple: "/icons/icon-192.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
