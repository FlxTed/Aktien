"use client";

import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/lib/currency";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CurrencyProvider>{children}</CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
