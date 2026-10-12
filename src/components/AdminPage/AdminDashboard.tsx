"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  New: "Очікує підтвердження",
  Confirm: "Прийняте",
  Delived: "У дорозі",
  Delivered: "Доставлене",
};

type CatalogProduct = {
  id: number;
  name: string;
  price?: number | string | null;
  category?: string | null;
  images?: string[] | string | Record<string, unknown> | null;
  variants?: Array<Record<string, unknown>> | null;
};

type OrderProduct = {
  productId: number;
  name: string;
  selectedVariant: string;
  quantity: number;
  price: number;
  totalPrice: number;
  packageName: string;
  variantKey: string;
  image?: string;
};

type Order = {
  id: number;
  status: string;
  name: string;
  phone: string;
  adress: string;
  delivery: string;
  paymentType: string;
  prefferContactMethod: string;
  userChatId: string;
  userTelegram: string;
  products: OrderProduct[];
  ttn?: string | null;
};

type OrderForm = {
  name: string;
  phone: string;
  adress: string;
  delivery: string;
  status: string;
  paymentType: string;
  prefferContactMethod: string;
  userChatId: string;
  userTelegram: string;
  products: OrderProduct[];
};

const createEmptyForm = (): OrderForm => ({
  name: "",
  phone: "",
  adress: "",
  delivery: "nova-poshta-branch",
  status: "New",
  paymentType: "cash-on-delivery",
  prefferContactMethod: "telegram",
  userChatId: "",
  userTelegram: "",
  products: [],
});

const resolveProductImage = (images: CatalogProduct["images"]): string | undefined => {
  const firstImage = Array.isArray(images) ? images[0] : images;

  if (typeof firstImage === "string") {
    return firstImage;
  }

  const imageObject = firstImage as Record<string, unknown> | null | undefined;
  const maybeUrl = imageObject?.url;

  return typeof maybeUrl === "string" ? maybeUrl : undefined;
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<OrderForm>(createEmptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const metrics = useMemo(() => {
    const newOrdersCount = orders.filter((order) => order.status === "New").length;
    const totalUsers = new Set(orders.map((order) => order.phone || order.name)).size;
    const lastOrder = orders[0] ?? null;

    return {
      totalOrders: orders.length,
      newOrders: newOrdersCount,
      totalUsers,
      lastOrderDate: lastOrder ? new Date(Number(lastOrder.id)).toLocaleDateString("uk-UA") : "—",
    };
  }, [orders]);

  const refreshCatalog = async () => {
    const response = await fetch("/api/products/get-all");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { products?: CatalogProduct[] };
    setCatalog(Array.isArray(payload.products) ? payload.products : []);
  };

  const refreshOrders = async () => {
    const response = await fetch("/api/admin/orders");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { orders?: Order[] };
    setOrders(Array.isArray(payload.orders) ? payload.orders : []);
  };

  const verifySession = async () => {
    const response = await fetch("/api/admin/session");
    const payload = (await response.json()) as { authenticated?: boolean };
    const isValidSession = Boolean(payload.authenticated);
    setIsAuthenticated(isValidSession);

    if (isValidSession) {
      await Promise.all([refreshCatalog(), refreshOrders()]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void verifySession();
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setSelectedProductId("");
    setSelectedQuantity(1);
    setEditingId(null);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginForm),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setLoginError(payload.error ?? "Невірні дані для входу");
      return;
    }

    setIsAuthenticated(true);
    await Promise.all([refreshCatalog(), refreshOrders()]);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setOrders([]);
    setCatalog([]);
    resetForm();
  };

  const addProductToOrder = () => {
    if (!selectedProductId) {
      return;
    }

    const selectedProduct = catalog.find((product) => product.id === Number(selectedProductId));

    if (!selectedProduct) {
      return;
    }

    const price = Number(selectedProduct.price ?? 0);
    const variants = Array.isArray(selectedProduct.variants)
      ? selectedProduct.variants.filter(Boolean)
      : [];
    const selectedVariant =
      variants[0] && typeof variants[0].name === "string"
        ? variants[0].name
        : variants[0] && typeof variants[0].title === "string"
          ? variants[0].title
          : "1 упаковка";

    const nextItem: OrderProduct = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      selectedVariant,
      quantity: selectedQuantity,
      price,
      totalPrice: price * selectedQuantity,
      packageName: selectedVariant,
      variantKey: String(selectedProduct.id),
      image: resolveProductImage(selectedProduct.images),
    };

    setForm((currentForm) => ({
      ...currentForm,
      products: [...currentForm.products, nextItem],
    }));
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const handleFormChange = <K extends keyof OrderForm>(key: K, value: OrderForm[K]) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  };

  const handleRemoveProduct = (productId: number) => {
    setForm((currentForm) => ({
      ...currentForm,
      products: currentForm.products.filter((item) => item.productId !== productId),
    }));
  };

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...form,
      id: editingId ?? undefined,
      products: form.products.map((item) => ({
        ...item,
        totalPrice: item.price * item.quantity,
      })),
    };

    const response = await fetch("/api/admin/orders", {
      method: editingId !== null ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }

    resetForm();
    await refreshOrders();
  };

  const handleEditOrder = (order: Order) => {
    setEditingId(order.id);
    setForm({
      name: order.name,
      phone: order.phone,
      adress: order.adress,
      delivery: order.delivery,
      status: order.status,
      paymentType: order.paymentType,
      prefferContactMethod: order.prefferContactMethod,
      userChatId: order.userChatId,
      userTelegram: order.userTelegram,
      products: order.products,
    });
  };

  const handleDeleteOrder = async (orderId: number) => {
    const response = await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: orderId }),
    });

    if (!response.ok) {
      return;
    }

    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
    if (editingId === orderId) {
      resetForm();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Admin panel</p>
            <h1 className="mt-3 text-3xl font-semibold">Вхід до панелі</h1>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Логін</span>
              <input
                value={loginForm.login}
                onChange={(event) => setLoginForm((currentForm) => ({ ...currentForm, login: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                placeholder="admin"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Пароль</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((currentForm) => ({ ...currentForm, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                placeholder="••••••••"
              />
            </label>

            {loginError ? <p className="text-sm text-rose-400">{loginError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
            >
              Увійти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">India Pharm</p>
            <h1 className="mt-2 text-3xl font-semibold">Адмін панель</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
          >
            Вийти
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Загальна кількість замовлень</p>
            <p className="mt-5 text-3xl font-semibold">{metrics.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Нові замовлення</p>
            <p className="mt-5 text-3xl font-semibold text-amber-400">{metrics.newOrders}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Кількість користувачів</p>
            <p className="mt-5 text-3xl font-semibold text-cyan-400">{metrics.totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Останнє замовлення</p>
            <p className="mt-5 text-xl font-semibold">{metrics.lastOrderDate}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="text-xl font-semibold">Список замовлень</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{orders.length} записів</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-5 py-3">Клієнт</th>
                    <th className="px-5 py-3">Статус</th>
                    <th className="px-5 py-3">Телефон</th>
                    <th className="px-5 py-3">Товарів</th>
                    <th className="px-5 py-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        Немає замовлень
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-800">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-white">{order.name}</p>
                            <p className="text-xs text-slate-400">{order.adress}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{order.phone}</td>
                        <td className="px-5 py-4 text-slate-300">{order.products.length}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditOrder(order)}
                              className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
                            >
                              Редагувати
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteOrder(order.id)}
                              className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-rose-500 hover:text-rose-300"
                            >
                              Видалити
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingId ? "Редагування" : "Нове замовлення"}</h2>
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-xs text-slate-300 hover:text-white">
                  Скасувати
                </button>
              ) : null}
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <input
                value={form.name}
                onChange={(event) => handleFormChange("name", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                placeholder="Ім'я"
              />
              <input
                value={form.phone}
                onChange={(event) => handleFormChange("phone", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                placeholder="Телефон"
              />
              <textarea
                value={form.adress}
                onChange={(event) => handleFormChange("adress", event.target.value)}
                className="min-h-[96px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                placeholder="Адреса"
              />

              <select
                value={form.delivery}
                onChange={(event) => handleFormChange("delivery", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                <option value="nova-poshta-branch">Нова Пошта (відділення)</option>
                <option value="nova-poshta-courier">Нова Пошта (кур'єр)</option>
                <option value="pickup">Самовивіз</option>
              </select>

              <select
                value={form.status}
                onChange={(event) => handleFormChange("status", event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Товари</p>

                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value ? Number(event.target.value) : "")}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Вибрати товар</option>
                    {catalog.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(Math.max(1, Number(event.target.value) || 1))}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={addProductToOrder}
                  className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Додати товар
                </button>

                <div className="mt-3 space-y-2">
                  {form.products.length === 0 ? (
                    <p className="text-xs text-slate-400">Товари ще не додані</p>
                  ) : (
                    form.products.map((item) => (
                      <div key={`${item.productId}-${item.selectedVariant}`} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-2">
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {item.quantity} × {item.price} грн
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.productId)}
                          className="text-xs text-rose-300 hover:text-rose-200"
                        >
                          Видалити
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.paymentType}
                  onChange={(event) => handleFormChange("paymentType", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="Тип оплати"
                />
                <input
                  value={form.prefferContactMethod}
                  onChange={(event) => handleFormChange("prefferContactMethod", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="Спосіб зв'язку"
                />
                <input
                  value={form.userChatId}
                  onChange={(event) => handleFormChange("userChatId", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="Telegram chat ID"
                />
                <input
                  value={form.userTelegram}
                  onChange={(event) => handleFormChange("userTelegram", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="Telegram user"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                {editingId ? "Оновити замовлення" : "Зберегти замовлення"}
              </button>
            </form>
          </aside>
        </section>
      </div>
    </div>
  );
}
