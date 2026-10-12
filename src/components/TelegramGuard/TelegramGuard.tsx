"use client";

import { useEffect } from "react";

const BOT_URL = "https://t.me/india_pharm_bot";

export default function TelegramGuard() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const pathname = window.location.pathname;
    const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api");

    if (!tg) {
      if (!isAdminRoute) {
        window.location.replace(BOT_URL);
      }
      return;
    }

    tg.ready();
  }, []);

  return null;
}
