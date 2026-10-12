"use client";

import { useEffect } from "react";

const TELEGRAM_BOT_URL = "https://t.me/india_pharm_bot";

export default function TelegramGuard() {
  useEffect(() => {
    const pathname = window.location.pathname;
    const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api");
    const tg = window.Telegram?.WebApp;

    tg?.ready();

    if (!tg && !isAdminRoute) {
      window.location.replace(TELEGRAM_BOT_URL);
    }
  }, []);

  return null;
}
