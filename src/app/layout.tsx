import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SkillsGap.gy — Find your next move", template: "%s | SkillsGap.gy" },
  description: "SkillsGap.gy connects the skills people have in Guyana with local opportunities and training.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
