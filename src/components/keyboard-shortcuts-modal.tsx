"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: "R", desc: "Refresh portfolio" },
  { keys: "?", desc: "Show this shortcuts panel" },
];

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, [contenteditable]")) {
          e.preventDefault();
          onOpenChange(!open);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map(({ keys, desc }) => (
            <li key={keys} className="flex items-center justify-between gap-4">
              <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
                {keys}
              </kbd>
              <span className="text-muted-foreground">{desc}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
