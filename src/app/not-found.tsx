import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-foreground">
      <h1 className="text-7xl font-bold tracking-tight text-muted-foreground">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">Page not found.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:bg-primary/90 active:opacity-90"
      >
        Back to portfolio
      </Link>
    </div>
  );
}
