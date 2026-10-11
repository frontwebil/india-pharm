"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiLock, FiPackage } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { CartItem, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";
import { Header } from "@/components/MainPage/Header/Header";
import "./style.css";

type CartVariant = {
  id?: number | string;
  package?: string;
  price?: number | string;
};

function getCartVariant(value: unknown, item: CartItem): CartVariant | undefined {
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
  const cartItems = useCartStore((state) => state.items);
  const reconcileProducts = useCartStore((state) => state.reconcileProducts);
  const products = useProductsStore((state) => state.products);
  const loadProducts = useProductsStore((state) => state.loadProducts);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

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
        console.error("Не вдалося відновити дані для оформлення замовлення:", error);
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
        };
      }),
    [cartItems, products],
  );

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

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
        <div className="checkout-container">
          <Link className="checkout-back-link" href="/catalog">
            <FiArrowLeft aria-hidden="true" />
            Повернутися до каталогу
          </Link>

          <div className="checkout-heading">
            <div>
              <span className="checkout-eyebrow">Залишився останній крок</span>
              <h1>Оформлення замовлення</h1>
              <p>Заповніть контактні дані та оберіть зручні умови доставки.</p>
            </div>
            <div className="checkout-step" aria-label="Крок 2 з 2">
              <span>Крок 2 з 2</span>
              <div className="checkout-step-track">
                <span />
              </div>
              <small>Дані отримувача</small>
            </div>
          </div>

          {loadError && (
            <p className="checkout-error" role="alert">
              Не вдалося відновити кошик. Оновіть сторінку або поверніться до
              каталогу.
            </p>
          )}

          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={handleSubmit}>
              <section className="checkout-section">
                <div className="checkout-section-heading">
                  <span className="checkout-section-number">01</span>
                  <div>
                    <h2>Контактні дані</h2>
                    <p>Як до вас звертатися та як з вами зв’язатися</p>
                  </div>
                </div>

                <div className="checkout-fields">
                  <label className="checkout-field">
                    <span>Ім’я та прізвище</span>
                    <input
                      autoComplete="name"
                      name="name"
                      placeholder="Наприклад, Іван Петренко"
                      required
                    />
                  </label>
                  <label className="checkout-field">
                    <span>Телефон</span>
                    <input
                      autoComplete="tel"
                      inputMode="tel"
                      name="phone"
                      placeholder="+380 __ ___ __ __"
                      required
                      type="tel"
                    />
                  </label>
                  <label className="checkout-field checkout-field-full">
                    <span>Адреса доставки</span>
                    <textarea
                      autoComplete="street-address"
                      name="address"
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
                      <input
                        name="delivery"
                        type="radio"
                        value="ukrposhta"
                      />
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
                      <input
                        name="contact"
                        type="radio"
                        value="phone-call"
                      />
                      <span className="checkout-radio-mark" />
                      <span className="checkout-choice-copy">
                        <strong>Телефонний дзвінок</strong>
                        <small>Зателефонуємо за вказаним номером</small>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </section>

              {/* <button className="checkout-submit" type="submit">
                Оформити замовлення
              </button>
              <p className="checkout-form-note">
                Натискання кнопки поки не надсилає дані — оформлення буде
                підключено пізніше.
              </p> */}
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
