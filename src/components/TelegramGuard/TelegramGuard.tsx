"use client";

import { useEffect } from "react";

export default function TelegramGuard() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
  }, []);

  return null;
}
