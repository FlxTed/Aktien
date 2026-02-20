"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body style={{ backgroundColor: "#111", color: "#e5e5e5", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1rem" }}>
          If you just deployed: set DATABASE_URL (PostgreSQL) and NEXTAUTH_SECRET in Vercel, run migrations, then redeploy.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "0.75rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <pre style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#666", overflow: "auto" }}>
          {typeof error?.message === "string" ? error.message.slice(0, 400) : "Unknown error"}
        </pre>
      </body>
    </html>
  );
}
