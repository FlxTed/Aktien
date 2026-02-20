/**
 * Returns a short relative time string for a past date (e.g. "just now", "2 min ago").
 */
export function getRelativeTimeString(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return diffMin === 1 ? "1 min ago" : `${diffMin} min ago`;
  if (diffHour < 24) return diffHour === 1 ? "1 hr ago" : `${diffHour} hr ago`;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Greeting by time of day.
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
