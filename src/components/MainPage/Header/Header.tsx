"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import "./style.css";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { categories } from "@/components/CatalogPage/categories";
import { CartItem, useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";

type CartVariant = {
  id?: number | string;
  package?: string;
  price?: number | string;
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

function formatCartPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price)
    ? `${price.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн`
    : "Ціну уточнюйте";
}

export function Header() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const products = useProductsStore((state) => state.products);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const catalogRef = useRef<HTMLDivElement>(null);

  const resolvedCartItems = cartItems.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) return [];

    const variant = getCartVariant(product.variants, item);
    const images = Array.isArray(product.images) ? product.images : [];
    const image = images.find(
      (entry): entry is string => typeof entry === "string",
    );
    const price = Number(variant?.price ?? product.price);

    return [
      {
        ...item,
        product,
        variant,
        image,
        price,
        lineTotal: Number.isFinite(price) ? price * item.quantity : 0,
      },
    ];
  });
  const cartTotal = resolvedCartItems.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        catalogRef.current &&
        !catalogRef.current.contains(event.target as Node)
      ) {
        setIsCatalogOpen(false);
        setIsCartOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    if (isCatalogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isCatalogOpen]);

  return (
    <>
      <header className="header">
        <div className="header-container" ref={catalogRef}>
          <Link href="/" className="header-logo-link">
            <Image
              src="/header-logo.webp"
              width={168}
              height={84}
              alt="India Pharm"
              className="header-logo"
            />
          </Link>

          <nav className="header-container-right">
            <div className="header-catalog-wrapper">
              <button
                type="button"
                className={`header-catalog ${
                  isCatalogOpen ? "header-catalog-active" : ""
                }`}
                onClick={() => {
                  setIsCatalogOpen((prev) => !prev);
                  setIsCartOpen(false);
                }}
              >
                <span>Каталог</span>

                <span
                  className={`header-catalog-arrow ${
                    isCatalogOpen ? "header-catalog-arrow-open" : ""
                  }`}
                >
                  <IoIosArrowDown />
                </span>
              </button>

              {isCatalogOpen && (
                <div className="catalog-dropdown">
                  <div className="catalog-header">
                    <span>Категорії товарів</span>

                    <button
                      type="button"
                      className="catalog-close"
                      onClick={() => setIsCatalogOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <Link href={"/catalog"} className="catalog-category-all">
                    <h3>Усі категорії</h3>
                    <FaArrowRight />
                  </Link>

                  <div className="catalog-content">
                    {categories.map((category) => (
                      <div className="catalog-category" key={category.title}>
                        <h3>{category.title}</h3>

                        <div className="catalog-category-items">
                          {category.items.map(([title, href]) => (
                            <Link
                              href={href}
                              key={href}
                              onClick={() => setIsCatalogOpen(false)}
                            >
                              {title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="header-cart-wrapper">
              <button
                type="button"
                className={`header-cart ${isCartOpen ? "header-cart-active" : ""}`}
                aria-expanded={isCartOpen}
                aria-label={`Кошик, товарів: ${cartCount}`}
                onClick={() => {
                  setIsCartOpen((current) => !current);
                  setIsCatalogOpen(false);
                }}
              >
                <span className="header-cart-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 4H5L7.4 15.2C7.5 15.7 8 16 8.5 16H18.5C19 15.7 19.4 15.2 19.6 14.7L21 9H6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                  </svg>
                </span>

                <span>Кошик</span>

                <span className="header-cart-count">{cartCount}</span>
              </button>

              {isCartOpen && (
                <section className="header-cart-dropdown" aria-label="Кошик">
                  <div className="header-cart-dropdown-heading">
                    <div>
                      <strong>Ваш кошик</strong>
                      <span>
                        {cartCount} {cartCount === 1 ? "товар" : "товарів"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="catalog-close"
                      aria-label="Закрити кошик"
                      onClick={() => setIsCartOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  {cartItems.length === 0 ? (
                    <p className="header-cart-empty">Кошик поки порожній.</p>
                  ) : resolvedCartItems.length === 0 ? (
                    <p className="header-cart-empty">
                      Перевіряємо актуальні товари...
                    </p>
                  ) : (
                    <>
                      <div className="header-cart-items">
                        {resolvedCartItems.map((item) => (
                          <article
                            className="header-cart-item"
                            key={`${item.productId}-${item.variantKey}-${item.packageName}`}
                          >
                            <Link
                              href={`/product/${item.productId}`}
                              className="header-cart-item-image"
                              onClick={() => setIsCartOpen(false)}
                            >
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt=""
                                  fill
                                  sizes="64px"
                                />
                              ) : (
                                <span aria-hidden="true">＋</span>
                              )}
                            </Link>
                            <div className="header-cart-item-details">
                              <Link
                                href={`/product/${item.productId}`}
                                className="header-cart-item-name"
                                onClick={() => setIsCartOpen(false)}
                              >
                                {item.product.name}
                              </Link>
                              {item.packageName && (
                                <span className="header-cart-item-package">
                                  {item.packageName}
                                </span>
                              )}
                              <strong>{formatCartPrice(item.price)}</strong>
                              <div className="header-cart-item-controls">
                                <div className="header-cart-quantity">
                                  <button
                                    type="button"
                                    aria-label="Зменшити кількість"
                                    onClick={() =>
                                      setQuantity(
                                        item.productId,
                                        item.variantKey,
                                        item.packageName,
                                        item.quantity - 1,
                                      )
                                    }
                                  >
                                    <FiMinus />
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    type="button"
                                    aria-label="Збільшити кількість"
                                    onClick={() =>
                                      setQuantity(
                                        item.productId,
                                        item.variantKey,
                                        item.packageName,
                                        item.quantity + 1,
                                      )
                                    }
                                  >
                                    <FiPlus />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="header-cart-remove"
                                  aria-label={`Видалити ${item.product.name} з кошика`}
                                  onClick={() =>
                                    removeItem(
                                      item.productId,
                                      item.variantKey,
                                      item.packageName,
                                    )
                                  }
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <div className="header-cart-total">
                        <span>Разом</span>
                        <strong>{formatCartPrice(cartTotal)}</strong>
                      </div>
                      <p className="header-cart-order-hint">
                        Для оформлення замовлення натисніть кнопку {"Оформити замовлення"}{" "}
                        в нижній частині екрану.
                      </p>
                    </>
                  )}
                </section>
              )}
            </div>
          </nav>
        </div>
      </header>
      <div className="div-header-space"></div>
    </>
  );
}
