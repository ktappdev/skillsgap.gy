import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { DemoStatusNotice } from "@/components/demo-status-notice";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://skillsgap.gy";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SkillsGap.gy — Find your next move", template: "%s | SkillsGap.gy" },
  description: "SkillsGap.gy connects the skills people have in Guyana with local opportunities and training.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "SkillsGap.gy — Find your next move",
    description: "SkillsGap.gy connects the skills people have in Guyana with local opportunities and training.",
    siteName: "SkillsGap.gy",
    type: "website",
    locale: "en_GY",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent">
          Skip to content
        </a>
        <DemoStatusNotice />
        {/* Toasts and confirmations outlive the page subtree that triggers them:
         * clearing a pathway unmounts its own button, so its confirmation cannot
         * live inside it. Mounted once here so every route shares one surface. */}
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
