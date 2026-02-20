"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertsNavLink() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alerts", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !Array.isArray(d?.alerts)) return;
        const active = d.alerts.filter((a: { triggered?: boolean }) => !a.triggered).length;
        setCount(active);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const isActive = pathname === "/alerts";

  return (
    <Link
      href="/alerts"
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors active:opacity-80",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <motion.span
        className="relative inline-flex"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="h-6 w-6" />
        {count != null && count > 0 && (
          <span
            className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            aria-label={`${count} active alerts`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </motion.span>
      <span>Alerts</span>
    </Link>
  );
}
