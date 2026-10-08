"use client";
import "./style.css";
import { useState } from "react";

export function Test() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onClick() {
    if (isSyncing) return;

    setIsSyncing(true);
    setSuccess(false);
    setLogs([]);

    try {
      const response = await fetch("/api/syncProducts", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const messages = buffer.split("\n\n");

        buffer = messages.pop() ?? "";

        for (const message of messages) {
          if (!message.startsWith("data: ")) continue;

          const data = JSON.parse(message.slice(6));

          if (typeof data === "string") {
            setLogs((prev) => [...prev, data]);
            continue;
          }

          if (data.type === "complete") {
            setLogs((prev) => [
              ...prev,
              `✓ Синхронізацію завершено. Синхронізовано ${data.count} товарів.`,
            ]);

            setSuccess(true);
          }

          if (data.type === "error") {
            setLogs((prev) => [...prev, `✕ Error: ${data.message}`]);
          }
        }
      }
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        `✕ ${
          error instanceof Error ? error.message : "Synchronization failed"
        }`,
      ]);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="sync">
      <button
        type="button"
        onClick={onClick}
        disabled={isSyncing}
        className="sync-button"
      >
        {isSyncing ? "Синхронізація..." : "Синхронізувати товари"}
      </button>

      {logs.length >= 0 && (
        <div className="sync-logs">
          <div className="sync-logs-header">
            <span>Логи</span>

            <span
              className={`sync-status ${
                isSyncing
                  ? "sync-status-loading"
                  : success
                    ? "sync-status-success"
                    : "sync-status-error"
              }`}
            >
              {isSyncing ? "Виконується" : success ? "Завершено" : ""}
            </span>
          </div>

          <div className="sync-logs-body">
            {logs.map((log, index) => (
              <div className="sync-log" key={index}>
                {log}
              </div>
            ))}

            {isSyncing && (
              <div className="sync-log sync-log-loading">
                <span className="sync-spinner" />
                Обробка...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
