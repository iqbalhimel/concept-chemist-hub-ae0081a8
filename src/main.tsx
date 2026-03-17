import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import iqbalSirUrl from "./assets/iqbal-sir.webp";

// Inject a high-priority preload for the LCP hero image before React renders.
// Vite resolves the hashed asset URL at build time so this always points to
// the correct file, enabling the browser to start fetching it immediately.
const _heroPreload = document.createElement("link");
_heroPreload.rel = "preload";
_heroPreload.as = "image";
_heroPreload.href = iqbalSirUrl;
_heroPreload.setAttribute("fetchpriority", "high");
document.head.appendChild(_heroPreload);

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for caching & offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
