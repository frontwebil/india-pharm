"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  New: "Очікує підтвердження",
  Confirm: "Прийняте",
  Delived: "У дорозі",
  Delivered: "Доставлене",
};

const STATUS_STYLES: Record<string, string> = {
  New: "bg-amber-100 text-amber-700 border border-amber-200",
  Confirm: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  Delived: "bg-violet-100 text-violet-700 border border-violet-200",
  Delivered: "bg-blue-600/10 text-blue-700 border border-blue-200",
};

const STATUS_FILTERS = [
  { key: "all", label: "Усі статуси" },
  { key: "New", label: "Нові" },
  { key: "Confirm", label: "Прийняті" },
  { key: "Delived", label: "У дорозі" },
  { key: "Delivered", label: "Доставлені" },
] as const;

type Order = {
  id: number;
  status: string;
  name: string;
  phone: string;
  adress: string;
  prefferContactMethod?: string | null;
  userTelegram?: string | null;
  createdAt?: string | null;
  products: Array<{
    name: string;
    quantity: number;
    price?: number;
    selectedVariant?: string | null;
    packageName?: string | null;
    variantKey?: string | null;
  }>;
};

export default function AdminOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<
    (typeof STATUS_FILTERS)[number]["key"] | "all"
  >("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const loadOrders = async () => {
    const response = await fetch("/api/admin/orders");
    if (!response.ok) {
      setOrders([]);
      setIsAuthenticated(false);
      return;
    }

    const payload = (await response.json()) as { orders?: Order[] };
    setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    setIsAuthenticated(true);
  };

  const loadOverview = async () => {
    const response = await fetch("/api/admin/overview");
    if (!response.ok) {
      setTotalUsers(0);
      return;
    }

    const payload = (await response.json()) as { totalUsers?: number };
    setTotalUsers(
      typeof payload.totalUsers === "number" ? payload.totalUsers : 0,
    );
  };

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch("/api/admin/session");
      const payload = (await response.json()) as { authenticated?: boolean };
      if (payload.authenticated) {
        await Promise.all([loadOrders(), loadOverview()]);
      }
      setIsLoading(false);
    };

    void checkSession();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      const matchesDate =
        !selectedDate ||
        !order.createdAt ||
        new Date(order.createdAt).toISOString().slice(0, 10) === selectedDate;
      return matchesStatus && matchesDate;
    });
  }, [orders, selectedDate, selectedStatus]);

  const groupedOrdersByDate = useMemo(() => {
    const groups = new Map<string, Order[]>();

    filteredOrders.forEach((order) => {
      const key = order.createdAt
        ? new Intl.DateTimeFormat("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date(order.createdAt))
        : "Без дати";

      const list = groups.get(key) ?? [];
      list.push(order);
      groups.set(key, list);
    });

    return [...groups.entries()].sort(([left], [right]) => {
      if (left === "Без дати") return 1;
      if (right === "Без дати") return -1;
      return (
        new Date(right.split(".").reverse().join("-")).getTime() -
        new Date(left.split(".").reverse().join("-")).getTime()
      );
    });
  }, [filteredOrders]);

  const formatPreferredContact = (order: Order) => {
    if (order.prefferContactMethod === "telegram") {
      const username = (order.userTelegram ?? "").trim();
      return username ? `@${username.replace(/^@/, "")}` : "Telegram";
    }

    return order.phone || "—";
  };

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const newOrders = orders.filter((order) => order.status === "New").length;
    const lastOrderDate = orders[0]?.createdAt
      ? new Date(orders[0].createdAt).toLocaleString("uk-UA", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    return { totalOrders, newOrders, totalUsers, lastOrderDate };
  }, [orders, totalUsers]);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setLoginError(payload.error ?? "Невірний логін або пароль");
      return;
    }

    setIsAuthenticated(true);
    await Promise.all([loadOrders(), loadOverview()]);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setOrders([]);
    setTotalUsers(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        Завантаження...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">
              Admin panel
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Вхід до панелі</h1>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Логін</span>
              <input
                value={loginForm.login}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({
                    ...currentForm,
                    login: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                placeholder="admin"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Пароль</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({
                    ...currentForm,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                placeholder="••••••••"
              />
            </label>

            {loginError ? (
              <p className="text-sm text-rose-400">{loginError}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500"
            >
              Увійти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">
              India Pharm
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Адмін панель</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/orders/new"
              className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
            >
              + Нове замовлення
            </Link>
            <button
              onClick={handleLogout}
              type="button"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-600"
            >
              Вийти
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Загальна кількість користувачів
            </p>
            <p className="mt-5 text-3xl font-semibold">{metrics.totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Кількість замовлень</p>
            <p className="mt-5 text-3xl font-semibold">{metrics.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Нові замовлення</p>
            <p className="mt-5 text-3xl font-semibold text-amber-400">
              {metrics.newOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Останнє замовлення</p>
            <p className="mt-5 text-base font-semibold leading-6">
              {metrics.lastOrderDate}
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-xl font-semibold">Замовлення</h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status.key}
                    type="button"
                    onClick={() =>
                      setSelectedStatus(status.key as typeof selectedStatus)
                    }
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      selectedStatus === status.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/40">
                <span>Дата</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="min-w-[150px] bg-transparent text-slate-900 outline-none [color-scheme:light]"
                />
              </label>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {filteredOrders.length} записів
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap">ID</th>
                  <th className="px-5 py-3 w-[220px] min-w-[220px]">Клієнт</th>
                  <th className="px-5 py-3 whitespace-nowrap">Статус</th>
                  <th className="px-5 py-3 whitespace-nowrap">Дата</th>
                  <th className="px-5 py-3 whitespace-nowrap">Зв'язок</th>
                  <th className="px-5 py-3 whitespace-nowrap">Контакти</th>
                  <th className="px-5 py-3 whitespace-nowrap">Товари</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedOrdersByDate.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      Немає замовлень
                    </td>
                  </tr>
                ) : (
                  groupedOrdersByDate.flatMap(([dateKey, dateOrders]) => [
                    <tr key={`${dateKey}-group`} className="bg-slate-50/80">
                      <td
                        colSpan={8}
                        className="px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-500"
                      >
                        {dateKey} · {dateOrders.length} замовлень
                      </td>
                    </tr>,
                    ...dateOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          #{order.id}
                        </td>
                        <td className="w-[220px] min-w-[220px] px-5 py-4">
                          <div className="max-w-[200px]">
                            <p className="truncate font-medium text-slate-900">
                              {order.name || "Без імені"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {order.adress || "Без адреси"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-slate-500/10 text-slate-600 border border-slate-500/20"}`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString(
                                "uk-UA",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          {order.prefferContactMethod === "telegram"
                            ? "Telegram"
                            : "Дзвінок"}
                        </td>
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          {formatPreferredContact(order)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="max-w-[220px] space-y-1">
                            {order.products
                              .slice(0, 3)
                              .map((product, index) => (
                                <div
                                  key={`${order.id}-${product.name}-${product.variantKey ?? index}`}
                                  className="text-xs text-slate-700"
                                >
                                  <span className="font-medium text-slate-900">
                                    {product.name}
                                  </span>
                                  {product.selectedVariant ||
                                  product.packageName ? (
                                    <span className="text-slate-500">
                                      {" "}
                                      ·{" "}
                                      {product.selectedVariant ||
                                        product.packageName}
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            {order.products.length > 3 ? (
                              <div className="text-[11px] text-slate-500">
                                +{order.products.length - 3} ще
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order.id}/edit`}
                            className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-blue-600 hover:text-blue-700"
                          >
                            Переглянути
                          </Link>
                        </td>
                      </tr>
                    )),
                  ])
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
