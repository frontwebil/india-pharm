"use client";

import { useEffect } from "react";
import { TELEGRAM_BOT_URL } from "@/config/telegram";

export default function TelegramGuard() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const pathname = window.location.pathname;
    const isAdminRoute =
      pathname.startsWith("/admin") || pathname.startsWith("/api");

    if (!tg?.initData && !isAdminRoute) {
      window.location.replace(TELEGRAM_BOT_URL);
      return;
    }

    if (tg?.initData) {
      tg.ready();
      tg.expand?.();
    }
  }, []);

  return null;
}
