import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { AuthSessionProvider } from "@/lib/providers/session-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview",
  description: "Interview LLM coding challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            <AuthSessionProvider>
              <QueryProvider>
                {children}
              </QueryProvider>
            </AuthSessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
