"use client";

import { useEffect, useState } from "react";

export function useTelegram() {
  const [tg, setTg] = useState(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setTg(window.Telegram.WebApp);
    }
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
