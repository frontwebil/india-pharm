import { WebApp } from "@types/telegram-web-app";

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

export {};
