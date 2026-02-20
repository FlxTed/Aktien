/**
 * Server-rendered banner – always in the initial HTML so it cannot be missed.
 * No client JS, no conditions. Shows on every page.
 */
export function DownloadBanner() {
  return (
    <div
      className="relative z-50 w-full border-b-2 border-primary bg-primary px-4 py-3 text-center"
      role="banner"
      aria-label="Download the app"
    >
      <p className="text-sm font-semibold text-white">
        📲 <span className="font-bold">DOWNLOAD THE APP</span> — Chrome or Edge: click the{" "}
        <strong>⊕ Install</strong> icon in the address bar for Windows notifications
      </p>
    </div>
  );
}
