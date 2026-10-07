"use client";

import { useEffect, useState } from "react";
import { WebApp } from "telegram-web-app";

export function useTelegram() {
  const [tg, setTg] = useState<WebApp | null>(null);

  useEffect(() => {
    if (!window.Telegram?.WebApp) {
      return;
    }

    const telegram = window.Telegram.WebApp;

    telegram.ready();
    telegram.expand();

    setTg(telegram);
  }, []);

  const onClose = () => {
    tg?.close();
  };

  const onToggleButton = () => {
    if (!tg) {
      return;
    }

    if (tg.MainButton.isVisible) {
      tg.MainButton.hide();
    } else {
      tg.MainButton.show();
    }
  };

  return {
    tg,
    onClose,
    onToggleButton,
    user: tg?.initDataUnsafe.user,
    queryId: tg?.initDataUnsafe.query_id,
  };
}
