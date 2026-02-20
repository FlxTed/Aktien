import Link from "next/link";

export function SetupRequired() {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: "#111", color: "#e5e5e5" }}
    >
      <h1 className="text-xl font-semibold">Setup required</h1>
      <p className="max-w-md text-center text-muted-foreground">
        The database is not configured. Add <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">DATABASE_URL</code> (PostgreSQL) and the other environment variables in your Vercel project settings, then redeploy.
      </p>
      <ul className="list-inside list-disc text-left text-sm text-muted-foreground">
        <li>DATABASE_URL (e.g. from Neon or Vercel Postgres)</li>
        <li>NEXTAUTH_URL (your app URL)</li>
        <li>NEXTAUTH_SECRET</li>
        <li>FINNHUB_API_KEY</li>
      </ul>
      <p className="text-center text-sm text-muted-foreground">
        See <code className="rounded bg-white/10 px-1.5 py-0.5">VERCEL_DEPLOY.md</code> in the repo for steps.
      </p>
      <Link
        href="https://vercel.com/docs/projects/environment-variables"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Vercel env vars docs
      </Link>
    </div>
  );
}
