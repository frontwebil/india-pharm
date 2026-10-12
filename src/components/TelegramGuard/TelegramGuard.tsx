"use client";

import { useTelegram } from "@/hooks/useTelegram";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const BOT_URL = "https://t.me/india_pharm_bot";

export default function TelegramGuard() {
  const pathname = usePathname();
  const { tg } = useTelegram();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isAdminRoute = pathname.startsWith("/admin");

    if (tg) {
      return;
    }

    if (!isAdminRoute) {
      window.location.replace(BOT_URL);
    }
  }, [pathname, tg]);

  return null;
}
