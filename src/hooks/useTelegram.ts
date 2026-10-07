const tg = window.Telegram?.WebApp;

export function useTelegram() {
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
