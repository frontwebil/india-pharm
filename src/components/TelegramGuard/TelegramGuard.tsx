"use client";

import { useTelegram } from "@/hooks/useTelegram";
import { useEffect } from "react";

const TELEGRAM_BOT_URL = "https://t.me/india_pharm_bot";

export default function TelegramGuard() {
  const { tg } = useTelegram();
  useEffect(() => {
    const pathname = window.location.pathname;
    const isAdminRoute =
      pathname.startsWith("/admin") || pathname.startsWith("/api");

    tg?.ready();

    if (!tg && !isAdminRoute) {
      window.location.replace(TELEGRAM_BOT_URL);
    }
  }, []);

  return null;
}
