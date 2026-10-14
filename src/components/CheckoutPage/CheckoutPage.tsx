"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { CartItem, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";
import { Header } from "@/components/MainPage/Header/Header";
import { CheckoutContactSection } from "@/components/CheckoutPage/CheckoutContactSection";
import {
  CheckoutOrderSummary,
  CheckoutSummaryItem,
} from "@/components/CheckoutPage/CheckoutOrderSummary";
import { CheckoutDeliverySection } from "@/components/CheckoutPage/CheckoutDeliverySection";
import { useTelegram } from "@/hooks/useTelegram";
import "./style.css";

type CartVariant = {
  id?: number | string;
  package?: string;
  price?: number | string;
};

type FormErrorState = Partial<Record<"phone" | "adress", boolean>>;

type CheckoutToast = {
  message: string;
  tone: "error";
};

function getCartVariant(
  value: unknown,
  item: CartItem,
): CartVariant | undefined {
  if (!Array.isArray(value)) return undefined;

  return value.find((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const variant = entry as CartVariant;
    return (
      (item.variantKey !== null &&
        String(variant.id ?? variant.package ?? "") === item.variantKey) ||
      (item.packageName !== null && variant.package === item.packageName)
    );
  }) as CartVariant | undefined;
}

export function CheckoutPage() {
  const router = useRouter();
  const { tg, onClose, user } = useTelegram();
  const cartItems = useCartStore((state) => state.items);
  const reconcileProducts = useCartStore((state) => state.reconcileProducts);
  const products = useProductsStore((state) => state.products);
  const loadProducts = useProductsStore((state) => state.loadProducts);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [selectedDeliveryPointType, setSelectedDeliveryPointType] = useState<
    "branch" | "postomat"
  >("branch");
  const [fieldErrors, setFieldErrors] = useState<FormErrorState>({});
  const [checkoutToast, setCheckoutToast] = useState<CheckoutToast | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const checkoutToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showCheckoutToast = useCallback((message: string) => {
    if (checkoutToastTimeout.current) {
      clearTimeout(checkoutToastTimeout.current);
    }

    setCheckoutToast({ message, tone: "error" });
    checkoutToastTimeout.current = setTimeout(
      () => setCheckoutToast(null),
      3500,
    );
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function initializeCheckout() {
      try {
        await useCartStore.persist.rehydrate();
        if (!isCurrent) return;

        if (useCartStore.getState().items.length === 0) {
          router.replace("/catalog");
          return;
        }

        await loadProducts();
        if (!isCurrent) return;

        const catalogProducts = useProductsStore.getState().products;
        if (catalogProducts.length > 0) {
          reconcileProducts(catalogProducts);
        }

        if (useCartStore.getState().items.length === 0) {
          router.replace("/catalog");
          return;
        }

        setIsReady(true);
      } catch (error) {
        console.error(
          "Не вдалося відновити дані для оформлення замовлення:",
          error,
        );
        if (isCurrent) {
          setLoadError(true);
          showCheckoutToast(
            "Не вдалося завантажити кошик. Оновіть сторінку та спробуйте ще раз.",
          );
        }
      }
    }

    void initializeCheckout();

    return () => {
      isCurrent = false;
    };
  }, [loadProducts, reconcileProducts, router, showCheckoutToast]);

  useEffect(
    () => () => {
      if (checkoutToastTimeout.current) {
        clearTimeout(checkoutToastTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (isReady && cartItems.length === 0) {
      router.replace("/catalog");
    }
  }, [cartItems.length, isReady, router]);

  const orderItems = useMemo<CheckoutSummaryItem[]>(
    () =>
      cartItems.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const variant = product
          ? getCartVariant(product.variants, item)
          : undefined;
        const images =
          product && Array.isArray(product.images) ? product.images : [];
        const image = images.find(
          (entry): entry is string => typeof entry === "string",
        );
        const price = Number(variant?.price ?? product?.price ?? 0);

        return {
          ...item,
          name: product?.name ?? `Товар #${item.productId}`,
          image,
          price: Number.isFinite(price) ? price : 0,
          selectedVariant: item.packageName || item.variantKey || "Стандарт",
        };
      }),
    [cartItems, products],
  );

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const userChatId = String(user?.id ?? "");
  const userTelegram = String(user?.username ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;
    if (orderItems.length === 0) {
      showCheckoutToast("Кошик порожній. Додайте товари перед оформленням.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nextErrors: FormErrorState = {};

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const adress = String(
      formData.get("adress") ?? formData.get("address") ?? "",
    )
      .toString()
      .trim();
    const delivery = String(formData.get("delivery") ?? "").trim();
    const paymentType = String(formData.get("payment") ?? "").trim();
    const prefferContactMethod = String(formData.get("contact") ?? "").trim();

    if (!phone) {
      nextErrors.phone = true;
      setFieldErrors(nextErrors);
      showCheckoutToast("Вкажіть номер телефону для зв’язку.");
      return;
    }

    setFieldErrors({});

    if (!delivery) {
      showCheckoutToast("Оберіть спосіб доставки.");
      return;
    }

    const deliveryPointType =
      delivery === "nova-poshta" ? selectedDeliveryPointType : "";

    if (delivery === "nova-poshta" && !deliveryPointType) {
      showCheckoutToast("Оберіть відділення або поштомат Нової пошти.");
      return;
    }

    const cityRef = String(formData.get("cityRef") ?? "");
    const warehouseRef = String(formData.get("warehouseRef") ?? "");
    if (
      delivery === "nova-poshta" &&
      (!cityRef || !warehouseRef)
    ) {
      setFieldErrors({ adress: true });
      showCheckoutToast("Оберіть місто та відділення або поштомат зі списку.");
      return;
    }

    if (!adress) {
      setFieldErrors({ adress: true });
      const message = "Вкажіть адресу або номер відділення для доставки.";
      showCheckoutToast(message);
      return;
    }

    if (!paymentType) {
      showCheckoutToast("Оберіть спосіб оплати.");
      return;
    }

    if (!prefferContactMethod) {
      showCheckoutToast("Оберіть, як з вами зв’язатися.");
      return;
    }

    if (
      prefferContactMethod !== "no-contact" &&
      (!userChatId || !userTelegram)
    ) {
      showCheckoutToast(
        !userChatId
          ? "Не вдалося отримати дані Telegram. Відкрийте магазин у Telegram і спробуйте ще раз."
          : "У вашому Telegram-профілі не вказано ім’я користувача. Додайте його та повторіть спробу.",
      );
      return;
    }

    setIsSubmitting(true);

    if (tg?.MainButton) {
      tg.MainButton.disable();
      tg.MainButton.setText("Відправляємо...");
    }

    const payload = {
      id: Date.now(),
      status: "New",
      name,
      phone,
      adress,
      delivery: deliveryPointType
        ? `${delivery}-${deliveryPointType}`
        : delivery,
      deliveryPointType: deliveryPointType || null,
      cityRef: cityRef || null,
      warehouseRef: warehouseRef || null,
      cityName: String(formData.get("cityName") ?? "") || null,
      warehouseName: String(formData.get("warehouseName") ?? "") || null,
      paymentType,
      prefferContactMethod,
      userChatId,
      userTelegram,
      products: orderItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        selectedVariant: item.selectedVariant,
        quantity: item.quantity,
        price: Number(item.price.toFixed(2)),
        totalPrice: Number((item.price * item.quantity).toFixed(2)),
        packageName: item.packageName ?? null,
        variantKey: item.variantKey ?? null,
        image: item.image ?? null,
      })),
    };

    const requestUrl = "/api/order";

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        showCheckoutToast(
          response.status >= 500
            ? "Сервер тимчасово недоступний. Зачекайте трохи та спробуйте ще раз."
            : "Не вдалося оформити замовлення. Перевірте дані та спробуйте ще раз.",
        );
        if (tg?.MainButton) {
          tg.MainButton.enable();
          tg.MainButton.setText("Оформити замовлення");
        }
        return;
      }

      useCartStore.getState().clearCart();

      await new Promise((resolve) => window.setTimeout(resolve, 100));

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Checkout submit failed:", error);
      showCheckoutToast(
        error instanceof TypeError
          ? "Не вдалося зв’язатися із сервером. Перевірте підключення до інтернету та спробуйте ще раз."
          : "Сталася помилка під час оформлення. Спробуйте ще раз.",
      );

      if (tg?.MainButton) {
        tg.MainButton.enable();
        tg.MainButton.setText("Оформити замовлення");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLocalTestRequest() {
    if (isSubmitting) return;

    const formData = formRef.current
      ? new FormData(formRef.current)
      : new FormData();
    const testDelivery = String(formData.get("delivery") ?? "") || "nova-poshta";
    const testDeliveryPointType =
      testDelivery === "nova-poshta"
        ? String(formData.get("deliveryPointType") ?? "") ||
          selectedDeliveryPointType
        : "";
    const testPayload = {
      id: Date.now(),
      status: "New",
      name: String(formData.get("name") ?? "").trim() || "Локальний тест",
      phone: String(formData.get("phone") ?? "").trim() || "+380000000000",
      adress:
        String(formData.get("adress") ?? "").trim() || "Тестова адреса",
      delivery: testDeliveryPointType
        ? `${testDelivery}-${testDeliveryPointType}`
        : testDelivery,
      deliveryPointType: testDeliveryPointType || null,
      cityRef: String(formData.get("cityRef") ?? "") || null,
      warehouseRef: String(formData.get("warehouseRef") ?? "") || null,
      cityName: String(formData.get("cityName") ?? "") || null,
      warehouseName: String(formData.get("warehouseName") ?? "") || null,
      paymentType:
        String(formData.get("payment") ?? "") || "cash-on-delivery",
      prefferContactMethod: String(formData.get("contact") ?? "") || "phone-call",
      userChatId: userChatId || "local-test",
      userTelegram: userTelegram || "local-test",
      products: orderItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        selectedVariant: item.selectedVariant,
        quantity: item.quantity,
        price: Number(item.price.toFixed(2)),
        totalPrice: Number((item.price * item.quantity).toFixed(2)),
        packageName: item.packageName ?? null,
        variantKey: item.variantKey ?? null,
        image: item.image ?? null,
      })),
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        showCheckoutToast(
          `Локальний тестовий запит завершився помилкою (HTTP ${response.status}).`,
        );
        return;
      }

      showCheckoutToast("Локальний тестовий запит успішно відправлено.");
    } catch (error) {
      console.error("Local checkout test request failed:", error);
      showCheckoutToast(
        "Не вдалося надіслати тестовий запит на локальний сервер.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!tg) return;

    const mainButton = tg.MainButton;
    const handleCheckout = () => {
      formRef.current?.requestSubmit();
    };

    if (isReady) {
      mainButton.setText(
        isSubmitting ? "Відправляємо..." : "Оформити замовлення",
      );
      mainButton.show();
      mainButton.onClick(handleCheckout);
    } else {
      mainButton.hide();
    }

    return () => {
      mainButton.offClick(handleCheckout);
    };
  }, [isReady, isSubmitting, tg]);

  if (!isReady && !loadError) {
    return (
      <>
        <Header />
        <main className="checkout-page">
          <div className="checkout-loading" role="status">
            Завантажуємо дані кошика…
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="checkout-page">
        {checkoutToast && (
          <div
            className={`checkout-toast checkout-toast-${checkoutToast.tone}`}
            role="alert"
            aria-live="assertive"
          >
            <span aria-hidden="true">!</span>
            {checkoutToast.message}
          </div>
        )}
        {isSubmitting && (
          <div
            className="checkout-page-loader"
            aria-live="polite"
            role="status"
          >
            <div className="checkout-page-loader-spinner" aria-hidden="true" />
          </div>
        )}
        <div className="checkout-container">
          <Link className="checkout-back-link" href="/catalog">
            <FiArrowLeft aria-hidden="true" />
            Повернутися до каталогу
          </Link>

          <div className="checkout-heading">
            <div>
              <h1>Оформлення замовлення</h1>
              <p>Заповніть контактні дані та оберіть зручні умови доставки.</p>
            </div>
          </div>

          {loadError && (
            <p className="checkout-error" role="alert">
              Не вдалося відновити кошик. Оновіть сторінку або поверніться до
              каталогу.
            </p>
          )}

          <div className="checkout-layout">
            <form
              className="checkout-form"
              noValidate
              onSubmit={handleSubmit}
              ref={formRef}
            >
              <CheckoutContactSection phoneError={Boolean(fieldErrors.phone)} />

              <CheckoutDeliverySection
                selectedDelivery={selectedDelivery}
                onDeliveryChange={setSelectedDelivery}
                deliveryPointType={selectedDeliveryPointType}
                onDeliveryPointTypeChange={setSelectedDeliveryPointType}
                addressError={Boolean(fieldErrors.adress)}
              />

              <section className="checkout-section checkout-section-last">
                <div className="checkout-section-heading">
                  <span className="checkout-section-number">03</span>
                  <div>
                    <h2>Як з вами зв’язатися?</h2>
                    <p>Щоб підтвердити деталі замовлення</p>
                  </div>
                </div>

                <fieldset className="checkout-choice-group checkout-contact">
                  <legend>Бажаний тип зв’язку</legend>
                  <div className="checkout-choice-options">
                    <label className="checkout-choice">
                      <input
                        name="contact"
                        type="radio"
                        value="telegram"
                      />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Telegram</strong>
                        <small>Напишемо вам у месенджер</small>
                      </span>
                    </label>
                    <label className="checkout-choice">
                      <input name="contact" type="radio" value="phone-call" />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Телефонний дзвінок</strong>
                        <small>Зателефонуємо за вказаним номером</small>
                      </span>
                    </label>
                    <label className="checkout-choice">
                      <input name="contact" type="radio" value="no-contact" />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Не перезванювати</strong>
                        <small>Не дзвонити й не писати в месенджер</small>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </section>
            </form>

            <CheckoutOrderSummary
              items={orderItems}
              total={total}
              isSubmitting={isSubmitting}
              onLocalTestRequest={() => void handleLocalTestRequest()}
            />
          </div>
        </div>
      </main>
    </>
  );
}
