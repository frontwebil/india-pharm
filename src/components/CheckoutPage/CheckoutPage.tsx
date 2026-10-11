"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiLock, FiPackage } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { CartItem, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";
import { Header } from "@/components/MainPage/Header/Header";
import { useTelegram } from "@/hooks/useTelegram";
import "./style.css";

type CartVariant = {
  id?: number | string;
  package?: string;
  price?: number | string;
};

type FormErrorState = Partial<Record<"name" | "phone" | "adress", boolean>>;

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

function formatPrice(value: number) {
  return `${value.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн`;
}

export function CheckoutPage() {
  const router = useRouter();
  const { tg, onClose } = useTelegram();
  const cartItems = useCartStore((state) => state.items);
  const reconcileProducts = useCartStore((state) => state.reconcileProducts);
  const products = useProductsStore((state) => state.products);
  const loadProducts = useProductsStore((state) => state.loadProducts);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrorState>({});
  const formRef = useRef<HTMLFormElement | null>(null);

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
        if (isCurrent) setLoadError(true);
      }
    }

    void initializeCheckout();

    return () => {
      isCurrent = false;
    };
  }, [loadProducts, reconcileProducts, router]);

  useEffect(() => {
    if (isReady && cartItems.length === 0) {
      router.replace("/catalog");
    }
  }, [cartItems.length, isReady, router]);

  const orderItems = useMemo(
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;
    if (orderItems.length === 0) {
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

    if (!name) nextErrors.name = true;
    if (!phone) nextErrors.phone = true;
    if (!adress) nextErrors.adress = true;

    setFieldErrors(nextErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      !delivery ||
      !paymentType ||
      !prefferContactMethod
    ) {
      return;
    }

    setIsSubmitting(true);

    if (tg?.MainButton) {
      tg.MainButton.disable();
      tg.MainButton.setText("Відправляємо...");
    }

    const payload = {
      status: "New",
      name,
      phone,
      adress,
      delivery,
      paymentType,
      prefferContactMethod,
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
      total: Number(total.toFixed(2)),
      currency: "UAH",
      source: "telegram-mini-app",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Не вдалося оформити замовлення. Спробуйте ще раз.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 800));

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      } else {
        onClose();
        router.replace("/catalog");
      }
    } catch (error) {
      console.error("Checkout submit failed:", error);

      if (tg?.MainButton) {
        tg.MainButton.enable();
        tg.MainButton.setText("Оформити замовлення");
      }
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
              onSubmit={handleSubmit}
              ref={formRef}
            >
              <section className="checkout-section">
                <div className="checkout-section-heading">
                  <span className="checkout-section-number">01</span>
                  <div>
                    <h2>Контактні дані</h2>
                    <p>Як до вас звертатися та як з вами зв’язатися</p>
                  </div>
                </div>

                <div className="checkout-fields">
                  <label
                    className={`checkout-field${fieldErrors.name ? " checkout-field-error" : ""}`}
                  >
                    <span>Ім’я та прізвище</span>
                    <input
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      name="name"
                      placeholder="Наприклад, Іван Петренко"
                      required
                    />
                  </label>
                  <label
                    className={`checkout-field${fieldErrors.phone ? " checkout-field-error" : ""}`}
                  >
                    <span>Телефон</span>
                    <input
                      autoComplete="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      inputMode="tel"
                      name="phone"
                      placeholder="+380 __ ___ __ __"
                      required
                      type="tel"
                    />
                  </label>
                  <label
                    className={`checkout-field checkout-field-full${fieldErrors.adress ? " checkout-field-error" : ""}`}
                  >
                    <span>Адреса доставки</span>
                    <textarea
                      autoComplete="street-address"
                      aria-invalid={Boolean(fieldErrors.adress)}
                      name="adress"
                      placeholder="Місто, номер або адреса відділення"
                      required
                      rows={3}
                    />
                  </label>
                </div>
              </section>

              <section className="checkout-section">
                <div className="checkout-section-heading">
                  <span className="checkout-section-number">02</span>
                  <div>
                    <h2>Доставка та оплата</h2>
                    <p>Оберіть зручний для вас спосіб</p>
                  </div>
                </div>

                <fieldset className="checkout-choice-group">
                  <legend>Тип доставки</legend>
                  <div className="checkout-choice-options">
                    <label className="checkout-choice">
                      <input
                        defaultChecked
                        name="delivery"
                        required
                        type="radio"
                        value="nova-poshta"
                      />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Нова пошта</strong>
                        <small>У відділення або поштомат</small>
                      </span>
                    </label>
                    <label className="checkout-choice">
                      <input name="delivery" type="radio" value="ukrposhta" />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Укрпошта</strong>
                        <small>Доставка у відділення</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="checkout-choice-group">
                  <legend>Оплата</legend>
                  <div className="checkout-choice-options">
                    <label className="checkout-choice">
                      <input
                        defaultChecked
                        name="payment"
                        required
                        type="radio"
                        value="cash-on-delivery"
                      />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Накладений платіж</strong>
                        <small>Оплата при отриманні</small>
                      </span>
                    </label>
                    <label className="checkout-choice">
                      <input
                        name="payment"
                        type="radio"
                        value="bank-transfer"
                      />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Оплата на рахунок</strong>
                        <small>Реквізити надасть менеджер</small>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </section>

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
                        defaultChecked
                        name="contact"
                        required
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
                  </div>
                </fieldset>
              </section>
            </form>

            <aside className="checkout-summary">
              <div className="checkout-summary-heading">
                <div className="checkout-summary-icon">
                  <FiPackage aria-hidden="true" />
                </div>
                <div>
                  <h2>Ваше замовлення</h2>
                  <span>
                    {orderItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    товар(и)
                  </span>
                </div>
              </div>

              <div className="checkout-order-items">
                {orderItems.map((item) => (
                  <div
                    className="checkout-order-item"
                    key={`${item.productId}-${item.variantKey}-${item.packageName}`}
                  >
                    <div className="checkout-product-image">
                      {item.image ? (
                        <Image
                          alt=""
                          height={64}
                          src={item.image}
                          unoptimized
                          width={64}
                        />
                      ) : (
                        <FiPackage aria-hidden="true" />
                      )}
                    </div>
                    <div className="checkout-product-details">
                      <strong>{item.name}</strong>
                      {item.packageName && <small>{item.packageName}</small>}
                      <span>
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </div>
                    <strong className="checkout-item-total">
                      {formatPrice(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="checkout-total">
                <span>Разом до сплати</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <div className="checkout-summary-note">
                <FiLock aria-hidden="true" />
                <p>Ваші дані потрібні лише для оформлення доставки.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
