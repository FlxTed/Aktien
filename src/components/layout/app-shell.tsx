"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, User, Sun, Moon, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertsNavLink } from "./alerts-nav-link";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { InstallAppButton } from "@/components/install-app-button";

const BOTTOM_NAV_HEIGHT = 56;

const NavLink = ({
  href,
  isActive,
  icon: Icon,
  label,
}: { href: string; isActive: boolean; icon: React.ElementType; label: string }) => (
  <Link href={href} className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs">
    <motion.span
      className={cn("flex flex-col items-center", isActive ? "text-primary" : "text-muted-foreground")}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-6 w-6" />
    </motion.span>
    <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>{label}</span>
  </Link>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="safe-area-pt sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border px-4 bg-background/95 backdrop-blur">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl transition-opacity active:opacity-80"
            aria-label="Aktien home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 shadow-soft">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Aktien</span>
          </Link>
        </motion.div>
        <div className="flex items-center gap-1.5">
          <InstallAppButton compact />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <main
        className="relative z-10 flex-1 overflow-auto"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 8 }}
      >
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border safe-area-pb bg-background/95 backdrop-blur"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        <NavLink href="/" isActive={pathname === "/"} icon={TrendingUp} label="Portfolio" />
        <AlertsNavLink />
        <NavLink href="/profile" isActive={pathname === "/profile"} icon={User} label="Profile" />
      </nav>
    </div>
  );
}
