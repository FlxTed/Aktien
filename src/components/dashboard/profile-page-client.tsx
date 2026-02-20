"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/use-toast";

export function ProfilePageClient({ session }: { session: Session | null }) {
  const { currency, setCurrency } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();
  const name = session?.user?.name ?? "Guest";
  const email = session?.user?.email ?? null;
  const [displayName, setDisplayName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === name) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error ?? "Failed to update", variant: "destructive" });
        return;
      }
      toast({ title: "Name updated", variant: "success" });
      router.refresh();
    } finally {
      setSavingName(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error ?? "Failed to delete account", variant: "destructive" });
        return;
      }
      await signOut({ callbackUrl: "/login", redirect: true });
      router.push("/login");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-md px-4 py-6"
    >
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your account details.
      </p>

      <Card className="mt-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {(displayName || name)[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{displayName || name}</p>
            {email && <p className="text-sm text-muted-foreground truncate">{email}</p>}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl"
                placeholder="Your name"
              />
              <Button
                size="sm"
                className="rounded-xl"
                onClick={saveName}
                disabled={savingName || displayName.trim() === name}
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Label>Display currency</Label>
            <Select value={currency} onValueChange={(v: "USD" | "EUR") => setCurrency(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Prices are shown in your chosen currency across the app.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-2xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your stocks and alerts. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); deleteAccount(); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}
