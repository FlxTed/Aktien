import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/use-toast";
import { AppShellWrapper } from "@/components/layout/app-shell-wrapper";
import { RegisterSW } from "@/components/register-sw";
import { DownloadBanner } from "@/components/download-banner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aktien",
  description: "Stock tracker - track prices, alerts, AI analysis.",
  applicationName: "Aktien",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aktien",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${dmSans.variable} font-sans min-h-[100dvh] safe-area-pb bg-background text-foreground`}>
        <Providers>
          <RegisterSW />
          <DownloadBanner />
          <AppShellWrapper>{children}</AppShellWrapper>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
