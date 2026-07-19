const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

type GtagCommand = "js" | "config" | "event";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (command: GtagCommand, target: string | Date, params?: Record<string, unknown>) => void;
  }
}

export function initializeGoogleAnalytics() {
  if (!measurementId || typeof window === "undefined" || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  // React Router page views are sent manually to avoid duplicate SPA events.
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackPageView(pathname: string) {
  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
  });
}
