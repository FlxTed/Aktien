"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, Monitor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isInstallableBrowser() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /Chrome\//.test(ua) || /Edge\//.test(ua);
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showAddressBarHint, setShowAddressBarHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setInstalled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleInstall = async () => {
    if (installEvent) {
      setInstalling(true);
      try {
        await installEvent.prompt();
        const { outcome } = await installEvent.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setInstallEvent(null);
      } finally {
        setInstalling(false);
      }
    } else {
      setShowAddressBarHint(true);
    }
  };

  if (installed) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
        <Check className="h-4 w-4 shrink-0" />
        <span>App installed — use it for Windows notifications</span>
      </div>
    );
  }

  if (!isInstallableBrowser()) {
    if (compact) {
      return (
        <span className="text-xs text-muted-foreground hidden sm:inline" title="Use Chrome or Edge on Windows to install the app">
          <Download className="h-4 w-4 inline-block mr-1 align-middle" />
          <span className="align-middle">Download</span> <span className="text-[10px]">(Chrome/Edge)</span>
        </span>
      );
    }
    return (
      <div className="rounded-xl border border-border/80 bg-card/80 px-3 py-2.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Monitor className="h-4 w-4 shrink-0" />
          Use <strong className="text-foreground">Chrome</strong> or <strong className="text-foreground">Edge</strong> on Windows to install. The app sends real Windows notifications (bottom-right).
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleInstall}
        disabled={installing}
        className="h-9 shrink-0 gap-1.5 rounded-xl border-primary/30 bg-primary/10 px-3 text-primary hover:bg-primary/20"
        title="Download app for Windows"
      >
        {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
        <span className="text-xs font-medium">Download app</span>
      </Button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
      <Button
        type="button"
        onClick={handleInstall}
        disabled={installing}
        className="w-full rounded-xl gap-2 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
      >
        {installing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {installing ? "Installing…" : "Download app — install now"}
      </Button>
      {showAddressBarHint && !installEvent && (
        <p className="text-xs text-muted-foreground">
          Click the <strong className="text-foreground">⊕ Install</strong> icon in your browser&apos;s address bar to install instantly.
        </p>
      )}
      {!showAddressBarHint && (
        <p className="text-xs text-muted-foreground">
          One click → app installed. Get stock alerts as Windows notifications (bottom-right).
        </p>
      )}
    </motion.div>
  );
}
