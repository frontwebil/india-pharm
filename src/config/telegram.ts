const DEFAULT_TELEGRAM_BOT_URL = "https://t.me/india_pharm_bot";

export const TELEGRAM_BOT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ??
  process.env.TELEGRAM_BOT_URL ??
  DEFAULT_TELEGRAM_BOT_URL;
