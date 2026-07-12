import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/lib/ThemeContext";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BiManager - Biodlingshantering",
  description: "Professionell hantering av biodling, bigårdar och bisamhällen",
  icons: {
    icon: "/bee-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "BiManager",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#292524" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <SessionProvider>
          <ThemeProvider>
            <Sidebar />
            <Header />
            <main className="lg:pl-64 min-h-screen">
              <div className="p-4 lg:p-8 pt-20 lg:pt-20">{children}</div>
            </main>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
