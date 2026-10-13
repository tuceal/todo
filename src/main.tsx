import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./styles.css";

// autoUpdate: yeni deploy algılanınca SW güncellenir ve sayfa kendini yeniler.
// Uygulama uzun süre açık kalırsa diye saatte bir de kontrol edilir.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
