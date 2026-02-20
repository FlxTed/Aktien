"use client";

import { AlertCircle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <footer className="mt-8 border-t border-border/60 py-4">
      <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This app is for informational purposes only. Not financial advice. Past performance does not guarantee future results. 
          Always do your own research before investing.
        </p>
      </div>
    </footer>
  );
}
