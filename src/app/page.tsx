"use client";

import { useTelegram } from "@/hooks/useTelegram";

export default function Home() {
  const { tg, user, queryId } = useTelegram();

  return (
    <main className="flex min-h-screen flex-col p-4 text-foreground">
      <header className="mb-6">
        <h1 className="text-xl font-bold">💊 India Pharm</h1>

        <p className="text-xs opacity-70">
          Анонімна доставка сертифікованих ліків
        </p>
      </header>

      <section className="rounded-xl border border-neutral-800 p-4">
        <h2 className="mb-4 text-lg font-semibold">Telegram User</h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="opacity-60">User ID:</span>{" "}
            {user?.id ?? "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Username:</span>{" "}
            {user?.username ? `@${user.username}` : "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">First name:</span>{" "}
            {user?.first_name ?? "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Last name:</span>{" "}
            {user?.last_name || "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Chat / Query ID:</span>{" "}
            {queryId ?? "Немає даних"}
          </p>
        </div>
      </section>

      <section className="mt-4 flex-1">{/* ProductList */}</section>
    </main>
  );
}
