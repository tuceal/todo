import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { STORAGE_KEY, TRANSFER_HASH } from "./store";
import "./styles.css";

// Kalıcı adres. Eski adreslerden gelen ziyaretçi, verisiyle birlikte buraya taşınır
// (localStorage adrese bağlı olduğu için veri hash içinde götürülür).
const CANONICAL_HOST = "yapilacaklarim.vercel.app";
const OLD_HOSTS = ["yapilacaklar-bay.vercel.app", "yapilacaklar-tuci.vercel.app", "yapilacaklar-git-main-tuci.vercel.app"];

if (OLD_HOSTS.includes(location.hostname)) {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // depolama kapalı
  }
  location.replace(`https://${CANONICAL_HOST}/` + (raw ? TRANSFER_HASH + encodeURIComponent(raw) : ""));
} else {
  start();
}

function start() {
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
}
