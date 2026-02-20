import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aktien",
    short_name: "Aktien",
    description: "Stock tracker - track prices, alerts, AI analysis",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1419",
    theme_color: "#3b82f6",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icon-512", type: "image/png", sizes: "512x512", purpose: "any" },
    ],
  };
}
