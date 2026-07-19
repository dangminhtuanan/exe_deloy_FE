
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { router } from "./app/routes.tsx";
import { initializeGoogleAnalytics, trackPageView } from "./app/lib/analytics.ts";
import "./styles/index.css";

initializeGoogleAnalytics();

let lastTrackedPath = "";
const trackCurrentRoute = (pathname: string) => {
  if (pathname === lastTrackedPath) return;
  lastTrackedPath = pathname;
  trackPageView(pathname);
};

trackCurrentRoute(router.state.location.pathname);
router.subscribe((state) => trackCurrentRoute(state.location.pathname));

createRoot(document.getElementById("root")!).render(<App />);
