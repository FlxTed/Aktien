"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const msg = typeof error?.message === "string" ? error.message : "";
  const isDbError =
    msg.includes("DATABASE_URL") ||
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1002") ||
    msg.toLowerCase().includes("connection") ||
    msg.includes("prisma") ||
    msg.includes("ECONNREFUSED");

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: "#111", color: "#e5e5e5" }}
    >
      <p className="text-center text-foreground">
        Something went wrong. Try again or go home.
      </p>
      {(isDbError || msg) && (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {isDbError
            ? "Database connection issue: set DATABASE_URL (PostgreSQL) in Vercel → Settings → Environment Variables and run migrations, then redeploy."
            : "If this keeps happening, check that DATABASE_URL and NEXTAUTH_SECRET are set on Vercel and that the database has run migrations."}
        </p>
      )}
      {msg && (
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="text-xs text-muted-foreground underline hover:no-underline"
        >
          {showDetails ? "Hide details" : "Show error details"}
        </button>
      )}
      {showDetails && msg && (
        <pre className="max-w-full overflow-auto rounded bg-white/10 p-3 text-left text-xs">
          {msg.slice(0, 500)}
        </pre>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="outline" className="rounded-xl">
          Try again
        </Button>
        <Button asChild variant="default" className="rounded-xl">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
