"use client";

import "@/components/CheckoutPage/style.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { NovaPoshtaFields } from "@/components/CheckoutPage/NovaPoshtaFields";

const STATUS_LABELS: Record<string, string> = {
  New: "Очікує підтвердження",
  Confirm: "Прийняте",
  Delived: "У дорозі",
  Delivered: "Доставлене",
};

type ProductVariant = {
  id?: number | string;
  package?: string;
  price?: number | string;
  name?: string;
};

type CatalogProduct = {
  id: number;
  name: string;
  price?: number | string | null;
  variants?: ProductVariant[] | null;
  images?: string[] | string | Record<string, unknown> | null;
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

type OrderRecord = {
  id?: number;
  status?: string;
  name?: string;
  phone?: string;
  adress?: string;
  delivery?: string;
  paymentType?: string;
  prefferContactMethod?: string;
  userChatId?: string;
  userTelegram?: string;
  ttn?: string | null;
  createdAt?: string | null;
  cityRef?: string | null;
  warehouseRef?: string | null;
  cityName?: string | null;
  warehouseName?: string | null;
  products?: Array<{
    productId?: number;
    name?: string;
    selectedVariant?: string;
    quantity?: number;
    price?: number;
    totalPrice?: number;
    packageName?: string | null;
    variantKey?: string | null;
    image?: string | null;
  }>;
};

function getVariantKey(variant: ProductVariant): string {
  if (variant.id !== undefined && variant.id !== null) {
    return String(variant.id);
  }

  if (typeof variant.package === "string" && variant.package.trim()) {
    return variant.package.trim();
  }

  return "default";
}

function getVariantLabel(variant: ProductVariant): string {
  if (typeof variant.package === "string" && variant.package.trim()) {
    return variant.package.trim();
  }

  if (typeof variant.name === "string" && variant.name.trim()) {
    return variant.name.trim();
  }

  return "Стандарт";
}

function getVariantPrice(
  product: CatalogProduct,
  variant: ProductVariant | null,
): number {
  const raw =
    variant && variant.price !== undefined && variant.price !== null
      ? variant.price
      : product.price;
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

const resolveProductImage = (
  images: CatalogProduct["images"],
): string | undefined => {
  const firstImage = Array.isArray(images) ? images[0] : images;
  if (typeof firstImage === "string") {
    return firstImage;
  }

  const imageObject = firstImage as Record<string, unknown> | null | undefined;
  const url = imageObject?.url;
  return typeof url === "string" ? url : undefined;
};

function normalizeOrderProduct(item: Record<string, unknown>): OrderProduct {
  const productId = Number(item.productId ?? 0);
  const quantity = Number(item.quantity ?? 1);
  const variantKey = String(item.variantKey ?? "default");
  const packageName = String(
    item.packageName ?? item.selectedVariant ?? "1 упаковка",
  );
  const price = Number(item.price ?? 0);
  const selectedVariant = String(
    item.selectedVariant ?? packageName ?? "1 упаковка",
  );

  return {
    productId,
    name: String(item.name ?? `Товар #${productId}`),
    selectedVariant,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    price: Number.isFinite(price) ? price : 0,
    totalPrice: Number(item.totalPrice ?? price * quantity),
    packageName,
    variantKey,
    image: typeof item.image === "string" ? item.image : undefined,
  };
}

function parseDelivery(value?: string) {
  if (!value) {
    return { delivery: "nova-poshta", pointType: "branch" as const };
  }

  if (value.startsWith("nova-poshta-")) {
    return {
      delivery: "nova-poshta",
      pointType: value.replace("nova-poshta-", "") as "branch" | "postomat",
    };
  }

  return {
    delivery: value,
    pointType: "branch" as const,
  };
}

export default function AdminOrderFormPage({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState("nova-poshta");
  const [deliveryPointType, setDeliveryPointType] = useState<
    "branch" | "postomat"
  >("branch");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedProductVariantKey, setSelectedProductVariantKey] =
    useState("default");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [novaPoshtaMeta, setNovaPoshtaMeta] = useState({
    cityRef: "",
    warehouseRef: "",
    cityName: "",
    warehouseName: "",
  });
  const [status, setStatus] = useState("New");
  const [ttn, setTtn] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [isEditorVisible, setIsEditorVisible] = useState(!orderId);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    adress: "",
    userChatId: "local-admin",
    userTelegram: "local-admin",
    paymentType: "cash-on-delivery",
    prefferContactMethod: "telegram",
  });

  const selectedProduct = useMemo(
    () =>
      catalog.find((product) => product.id === Number(selectedProductId)) ??
      null,
    [catalog, selectedProductId],
  );

  const selectedProductVariants = useMemo(() => {
    if (!selectedProduct) {
      return [] as ProductVariant[];
    }

    return Array.isArray(selectedProduct.variants)
      ? selectedProduct.variants.filter(
          (variant): variant is ProductVariant =>
            variant !== null && typeof variant === "object",
        )
      : [];
  }, [selectedProduct]);

  const total = useMemo(
    () => orderProducts.reduce((sum, item) => sum + item.totalPrice, 0),
    [orderProducts],
  );

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProductVariantKey("default");
      return;
    }

    const variants = selectedProductVariants;
    if (variants.length === 0) {
      setSelectedProductVariantKey("default");
      return;
    }

    const nextKey = getVariantKey(variants[0]);
    setSelectedProductVariantKey((current) => {
      if (
        current &&
        variants.some((variant) => getVariantKey(variant) === current)
      ) {
        return current;
      }

      return nextKey;
    });
  }, [selectedProductId, selectedProductVariants]);

  useEffect(() => {
    const verifyAccess = async () => {
      const response = await fetch("/api/admin/session");
      const payload = (await response.json()) as { authenticated?: boolean };
      if (!payload.authenticated) {
        router.replace("/admin");
        return;
      }

      setIsAllowed(true);

      const catalogResponse = await fetch("/api/products/get-all");
      if (catalogResponse.ok) {
        const catalogPayload = (await catalogResponse.json()) as {
          products?: CatalogProduct[];
        };
        setCatalog(
          Array.isArray(catalogPayload.products) ? catalogPayload.products : [],
        );
      }

      if (orderId) {
        const orderResponse = await fetch(
          `/api/admin/orders?id=${encodeURIComponent(orderId)}`,
        );
        if (orderResponse.ok) {
          const orderPayload = (await orderResponse.json()) as {
            order?: OrderRecord;
          };
          const currentOrder = orderPayload.order;
          const deliveryConfig = parseDelivery(currentOrder?.delivery);
          setSelectedDelivery(deliveryConfig.delivery);
          setDeliveryPointType(
            deliveryConfig.pointType === "postomat" ? "postomat" : "branch",
          );
          setStatus(currentOrder?.status ?? "New");
          setTtn(currentOrder?.ttn ?? "");
          setCreatedAt(currentOrder?.createdAt ?? null);
          setIsEditorVisible(false);
          setNovaPoshtaMeta({
            cityRef: currentOrder?.cityRef ?? "",
            warehouseRef: currentOrder?.warehouseRef ?? "",
            cityName: currentOrder?.cityName ?? "",
            warehouseName: currentOrder?.warehouseName ?? "",
          });
          setFormValues({
            name: currentOrder?.name ?? "",
            phone: currentOrder?.phone ?? "",
            adress: currentOrder?.adress ?? "",
            userChatId: currentOrder?.userChatId ?? "local-admin",
            userTelegram: currentOrder?.userTelegram ?? "local-admin",
            paymentType: currentOrder?.paymentType ?? "cash-on-delivery",
            prefferContactMethod:
              currentOrder?.prefferContactMethod ?? "telegram",
          });
          setOrderProducts(
            Array.isArray(currentOrder?.products)
              ? currentOrder.products.map((item) =>
                  normalizeOrderProduct(item as Record<string, unknown>),
                )
              : [],
          );
        }
      }

      setIsLoading(false);
    };

    void verifyAccess();
  }, [orderId, router]);

  const addProduct = () => {
    if (!selectedProductId) {
      return;
    }

    const product = catalog.find(
      (entry) => entry.id === Number(selectedProductId),
    );
    if (!product) {
      return;
    }

    const variants = Array.isArray(product.variants)
      ? product.variants.filter(
          (variant): variant is ProductVariant =>
            variant !== null && typeof variant === "object",
        )
      : [];

    const chosenVariant =
      variants.find(
        (variant) => getVariantKey(variant) === selectedProductVariantKey,
      ) ??
      variants[0] ??
      null;

    const packageName =
      chosenVariant &&
      typeof chosenVariant.package === "string" &&
      chosenVariant.package.trim()
        ? chosenVariant.package.trim()
        : "1 упаковка";

    const price = getVariantPrice(product, chosenVariant);
    const item: OrderProduct = {
      productId: product.id,
      name: product.name,
      selectedVariant: packageName,
      quantity: selectedQuantity,
      price,
      totalPrice: price * selectedQuantity,
      packageName,
      variantKey: chosenVariant
        ? getVariantKey(chosenVariant)
        : String(product.id),
      image: resolveProductImage(product.images),
    };

    setOrderProducts((currentProducts) => [...currentProducts, item]);
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (orderProducts.length === 0) {
      setSubmitError("Додайте хоча б один товар до замовлення");
      return;
    }

    if (status === "Delived" && !ttn.trim()) {
      setSubmitError("Для статусу \"У дорозі\" потрібно вказати ТТН");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const resolvedAddress =
      selectedDelivery === "nova-poshta"
        ? String(formData.get("adress") ?? formValues.adress ?? "").trim() ||
          formValues.adress
        : formValues.adress;
    const cityRef =
      String(formData.get("cityRef") ?? novaPoshtaMeta.cityRef ?? "") || null;
    const warehouseRef =
      String(
        formData.get("warehouseRef") ?? novaPoshtaMeta.warehouseRef ?? "",
      ) || null;
    const cityName =
      String(formData.get("cityName") ?? novaPoshtaMeta.cityName ?? "") || null;
    const warehouseName =
      String(
        formData.get("warehouseName") ?? novaPoshtaMeta.warehouseName ?? "",
      ) || null;

    const payload = {
      ...(orderId ? { id: Number(orderId) } : {}),
      status,
      name: formValues.name,
      phone: formValues.phone,
      adress: resolvedAddress,
      delivery:
        selectedDelivery === "nova-poshta"
          ? `nova-poshta-${deliveryPointType}`
          : selectedDelivery,
      deliveryPointType:
        selectedDelivery === "nova-poshta" ? deliveryPointType : null,
      cityRef,
      warehouseRef,
      cityName,
      warehouseName,
      paymentType: formValues.paymentType,
      prefferContactMethod: formValues.prefferContactMethod,
      userChatId: formValues.userChatId || "local-admin",
      userTelegram: formValues.userTelegram || "local-admin",
      ttn: status === "Delived" ? ttn.trim() : null,
      products: orderProducts.map((item) => ({
        productId: item.productId,
        name: item.name,
        selectedVariant: item.selectedVariant,
        quantity: item.quantity,
        price: Number(item.price.toFixed(2)),
        totalPrice: Number(item.totalPrice.toFixed(2)),
        packageName: item.packageName,
        variantKey: item.variantKey,
        image: item.image ?? null,
      })),
    };

    const response = await fetch("/api/admin/orders", {
      method: orderId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setSubmitError(
        orderId
          ? "Не вдалося оновити замовлення"
          : "Не вдалося зберегти замовлення",
      );
      return;
    }

    router.push("/admin");
  };

  if (isLoading || !isAllowed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Завантаження...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
              Order
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {orderId ? "Редагування замовлення" : "Нове замовлення"}
            </h1>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-white"
          >
            Назад до панелі
          </Link>
        </div>

        {orderId && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Замовлення #{orderId}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Інформація про замовлення</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditorVisible(true);
                  requestAnimationFrame(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                Редагувати
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Клієнт</p>
                <p className="mt-1 font-medium text-white">{formValues.name || "Без імені"}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Телефон</p>
                <p className="mt-1 font-medium text-white">{formValues.phone || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Зв'язок</p>
                <p className="mt-1 font-medium text-white">
                  {formValues.prefferContactMethod === "telegram"
                    ? `@${formValues.userTelegram || "username"}`
                    : "Телефонний дзвінок"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Статус</p>
                <p className="mt-1 font-medium text-white">{STATUS_LABELS[status] ?? status}</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Дата створення</p>
                <p className="mt-1 font-medium text-white">
                  {createdAt
                    ? new Date(createdAt).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Доставка</p>
                <p className="mt-1 font-medium text-white">
                  {selectedDelivery === "nova-poshta"
                    ? `Нова пошта · ${deliveryPointType === "postomat" ? "Поштомат" : "Відділення"}`
                    : "Укрпошта"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Оплата</p>
                <p className="mt-1 font-medium text-white">
                  {formValues.paymentType === "cash-on-delivery" ? "Накладний платіж" : "Оплата на рахунок"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Сума</p>
                <p className="mt-1 font-medium text-white">{total} грн</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 sm:col-span-2 xl:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Адреса / склад</p>
                <p className="mt-1 font-medium text-white">{novaPoshtaMeta.cityName || formValues.adress || "Без адреси"}</p>
                {novaPoshtaMeta.warehouseName ? (
                  <p className="mt-1 text-sm text-slate-300">{novaPoshtaMeta.warehouseName}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 sm:col-span-2 xl:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Товари</p>
                <div className="mt-2 space-y-1 text-sm text-slate-200">
                  {orderProducts.length === 0 ? (
                    <span>Товари відсутні</span>
                  ) : (
                    orderProducts.map((item) => (
                      <div key={`${item.productId}-${item.variantKey}-${item.packageName}`} className="flex items-center justify-between gap-2">
                        <span>
                          {item.name}
                          {item.selectedVariant ? ` · ${item.selectedVariant}` : ""}
                        </span>
                        <span className="text-slate-400">{item.quantity} × {item.price} грн</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {status === "Delived" || ttn ? (
                <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 sm:col-span-2 xl:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">ТТН</p>
                  <p className="mt-1 font-medium text-white">{ttn || "—"}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {(!orderId || isEditorVisible) && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
          >
          <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Контактні дані</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Ім’я
                  </span>
                  <input
                    value={formValues.name}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Телефон
                  </span>
                  <input
                    value={formValues.phone}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                    placeholder="+380..."
                  />
                </label>
              </div>

              {selectedDelivery !== "nova-poshta" && (
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Адреса / відділення
                  </span>
                  <textarea
                    value={formValues.adress}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        adress: event.target.value,
                      }))
                    }
                    className="min-h-[104px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </label>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Доставка</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { value: "nova-poshta", label: "Нова пошта" },
                  { value: "ukrposhta", label: "Укрпошта" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3"
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={selectedDelivery === option.value}
                      onChange={() => setSelectedDelivery(option.value)}
                      value={option.value}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              {selectedDelivery === "nova-poshta" && (
                <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { value: "branch", label: "Відділення" },
                      { value: "postomat", label: "Поштомат" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm"
                      >
                        <input
                          type="radio"
                          name="deliveryPointType"
                          checked={deliveryPointType === option.value}
                          onChange={() =>
                            setDeliveryPointType(
                              option.value as "branch" | "postomat",
                            )
                          }
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <NovaPoshtaFields
                    deliveryPointType={deliveryPointType}
                    invalid={false}
                  />
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Оплата й контакт</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <input
                    type="radio"
                    checked={formValues.paymentType === "cash-on-delivery"}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        paymentType: "cash-on-delivery",
                      }))
                    }
                    name="paymentType"
                  />
                  <span>Накладний платіж</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <input
                    type="radio"
                    checked={formValues.paymentType === "bank-transfer"}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        paymentType: "bank-transfer",
                      }))
                    }
                    name="paymentType"
                  />
                  <span>Оплата на рахунок</span>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <input
                    type="radio"
                    checked={formValues.prefferContactMethod === "telegram"}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        prefferContactMethod: "telegram",
                      }))
                    }
                    name="contact"
                  />
                  <span>Telegram</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <input
                    type="radio"
                    checked={formValues.prefferContactMethod === "phone-call"}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        prefferContactMethod: "phone-call",
                      }))
                    }
                    name="contact"
                  />
                  <span>Телефонний дзвінок</span>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Telegram chat id
                  </span>
                  <input
                    value={formValues.userChatId}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        userChatId: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Telegram username
                  </span>
                  <input
                    value={formValues.userTelegram}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        userTelegram: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Статус</h2>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {status === "Delived" && (
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">ТТН</span>
                  <input
                    value={ttn}
                    onChange={(event) => setTtn(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                    placeholder="Введіть номер ТТН"
                  />
                </label>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Товари</h2>

              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(event) =>
                    setSelectedProductId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
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
                  onChange={(event) =>
                    setSelectedQuantity(
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                  className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              {selectedProductId && (
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Варіант товару
                  </label>
                  <select
                    value={selectedProductVariantKey}
                    onChange={(event) =>
                      setSelectedProductVariantKey(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  >
                    {selectedProductVariants.length === 0 ? (
                      <option value="default">Стандартний варіант</option>
                    ) : (
                      selectedProductVariants.map((variant) => (
                        <option
                          key={getVariantKey(variant)}
                          value={getVariantKey(variant)}
                        >
                          {getVariantLabel(variant)} ·{" "}
                          {getVariantPrice(
                            selectedProduct!,
                            variant,
                          ).toLocaleString("uk-UA")}{" "}
                          грн
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={addProduct}
                className="w-full rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700"
              >
                Додати товар
              </button>

              <div className="space-y-2">
                {orderProducts.length === 0 ? (
                  <p className="text-sm text-slate-400">Товари ще не додані</p>
                ) : (
                  orderProducts.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantKey}-${item.packageName}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.selectedVariant} · {item.quantity} ×{" "}
                          {item.price} грн
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOrderProducts((current) =>
                            current.filter(
                              (el) =>
                                `${el.productId}-${el.variantKey}-${el.packageName}` !==
                                `${item.productId}-${item.variantKey}-${item.packageName}`,
                            ),
                          )
                        }
                        className="text-xs text-rose-300 hover:text-rose-200"
                      >
                        Видалити
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Разом</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-400">
                {total} грн
              </p>
            </div>

            {submitError ? (
              <p className="text-sm text-rose-400">{submitError}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
            >
              {orderId ? "Оновити замовлення" : "Зберегти замовлення"}
            </button>
          </aside>
        </form>
      )}
      </div>
    </div>
  );
}
