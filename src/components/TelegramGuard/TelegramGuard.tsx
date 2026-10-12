"use client";

import { useEffect } from "react";

const TELEGRAM_BOT_URL = "https://t.me/india_pharm_bot";

export default function TelegramGuard() {
  useEffect(() => {
    const pathname = window.location.pathname;
    const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api");
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0";

    const tg = window.Telegram?.WebApp;
    tg?.ready();

    if (!tg && !isAdminRoute && !isLocalhost) {
      window.location.replace(TELEGRAM_BOT_URL);
    }
  }, []);

  return null;
}
