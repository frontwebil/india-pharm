"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiRefreshCw, FiShoppingCart } from "react-icons/fi";
import { useProductsStore } from "@/store/productsStore";
import { Header } from "../MainPage/Header/Header";
import "./style.css";
import { categoryNames } from "../CatalogPage/categories";

export const getCategoryKey = (value: string): string | undefined => {
  return Object.keys(categoryNames).find((key) => categoryNames[key] === value);
};

type JsonRecord = Record<string, unknown>;

type ProductVariant = {
  id?: number;
  package?: string;
  price?: number | string;
  oldPrice?: number | string | null;
  discount?: number;
};

type ProductReview = {
  id?: number;
  date?: string;
  text?: string;
  author?: string;
  rating?: number;
};

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function formatPrice(value: unknown) {
  const price = Number(value);

  return Number.isFinite(price)
    ? `${price.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн`
    : "Ціну уточнюйте";
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getVariants(value: unknown): ProductVariant[] {
  return Array.isArray(value)
    ? value.filter(
        (variant): variant is ProductVariant =>
          variant !== null && typeof variant === "object",
      )
    : [];
}

function getReviews(value: unknown): ProductReview[] {
  return Array.isArray(value)
    ? value.filter(
        (review): review is ProductReview =>
          review !== null && typeof review === "object",
      )
    : [];
}

export function ProductPage({ id }: { id: string }) {
  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoading);
  const error = useProductsStore((state) => state.error);
  const loadProducts = useProductsStore((state) => state.loadProducts);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [openSections, setOpenSections] = useState<string[]>(["description"]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    void loadProducts().finally(() => {
      if (isCurrent) setHasLoaded(true);
    });

    return () => {
      isCurrent = false;
    };
  }, [loadProducts]);

  const product = products.find((item) => String(item.id) === id);

  const images = useMemo(() => {
    if (!product || !Array.isArray(product.images)) return [];

    return product.images.filter(
      (image): image is string =>
        typeof image === "string" && image.trim().length > 0,
    );
  }, [product]);

  const characteristics = useMemo(() => {
    if (!product) return [];

    return Object.entries(asRecord(product.characteristics)).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        String(value).trim().length > 0,
    );
  }, [product]);

  const variants = useMemo(
    () => (product ? getVariants(product.variants) : []),
    [product],
  );

  const reviews = useMemo(
    () => (product ? getReviews(product.reviews) : []),
    [product],
  );

  const sections = product
    ? [
        {
          key: "description",
          title: "Опис товару",
          text: getText(product.description),
        },
        {
          key: "indications",
          title: "Показання до застосування",
          text: getText(product.indications),
        },
        {
          key: "usage",
          title: "Спосіб застосування",
          text: getText(product.usage),
        },
        {
          key: "advantages",
          title: "Переваги",
          text: getText(product.advantages),
        },
        {
          key: "sideEffects",
          title: "Побічні реакції",
          text: getText(product.sideEffects),
        },
        {
          key: "contraindications",
          title: "Протипоказання",
          text: getText(product.contraindications),
        },
        {
          key: "overdose",
          title: "Передозування",
          text: getText(product.overdose),
        },
        {
          key: "storage",
          title: "Умови зберігання",
          text: getText(product.storage),
        },
      ].filter((section) => section.text)
    : [];

  const activeVariant = variants[selectedVariant];
  const activePrice = activeVariant?.price ?? product?.price;

  function toggleSection(key: string) {
    setOpenSections((current) =>
      current.includes(key)
        ? current.filter((section) => section !== key)
        : [...current, key],
    );
  }

  let key = "";
  if (product?.category) {
    key = getCategoryKey(product?.category);
  }

  return (
    <>
      <Header />

      {(!hasLoaded || isLoading) && (
        <div
          className="product-loader-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="product-loader-card">
            <span className="product-loader-spinner" aria-hidden="true" />
          </div>
        </div>
      )}

      <main className="product-page">
        <div className="product-page-container">
          {product ? (
            <>
              <nav
                className="product-breadcrumbs"
                aria-label="Навігаційний шлях"
              >
                <Link href="/">Головна</Link>
                <span aria-hidden="true">/</span>
                <Link href="/catalog">Каталог</Link>
                {product.category && (
                  <Link href={`/catalog/${key}`}>
                    <span aria-hidden="true">/</span>
                    <span> {product.category}</span>
                  </Link>
                )}
              </nav>

              <section className="product-overview">
                <div className="product-gallery">
                  <div className="product-main-image">
                    {images[selectedImage] ? (
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        fill
                        priority
                        sizes="(max-width: 760px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        Зображення товару
                      </div>
                    )}
                    {product.isTop && (
                      <span className="product-badge">Хіт продажу</span>
                    )}
                    {product.isSale && (
                      <span className="product-badge product-badge-sale">
                        Акція
                      </span>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div
                      className="product-thumbnails"
                      aria-label="Фотографії товару"
                    >
                      {images.map((image, index) => (
                        <button
                          className={`product-thumbnail ${selectedImage === index ? "product-thumbnail-active" : ""}`}
                          type="button"
                          key={`${image}-${index}`}
                          onClick={() => setSelectedImage(index)}
                          aria-label={`Показати зображення ${index + 1}`}
                          aria-pressed={selectedImage === index}
                        >
                          <Image src={image} alt="" fill sizes="88px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="product-summary">
                  {product.category && (
                    <span className="product-category">{product.category}</span>
                  )}
                  <h1>{product.name}</h1>

                  <div className="product-rating">
                    <span aria-label={`Рейтинг ${product.rating ?? 0} з 5`}>
                      {"★".repeat(
                        Math.max(
                          0,
                          Math.min(5, Math.round(product.rating ?? 0)),
                        ),
                      )}
                      <span className="product-rating-empty">
                        {"★".repeat(
                          5 -
                            Math.max(
                              0,
                              Math.min(5, Math.round(product.rating ?? 0)),
                            ),
                        )}
                      </span>
                    </span>
                    <span>
                      {product.rating
                        ? Number(product.rating).toFixed(1)
                        : "Без оцінки"}
                    </span>
                    {Number(product.reviewsCount) > 0 && (
                      <a href="#product-reviews">
                        {product.reviewsCount} відгуки
                      </a>
                    )}
                  </div>

                  {getText(product.shortDescription) && (
                    <p className="product-short-description">
                      {getText(product.shortDescription)}
                    </p>
                  )}

                  <div className="product-purchase-panel">
                    <span className="product-price-label">
                      Вартість упаковки
                    </span>
                    <div className="">
                      <strong className="product-price">
                        {formatPrice(activePrice)}
                      </strong>
                      {activeVariant?.oldPrice != null &&
                        Number(activeVariant.oldPrice) >
                          Number(activeVariant.price) && (
                          <span className="product-old-price ml-2">
                            {formatPrice(activeVariant.oldPrice)}
                          </span>
                        )}
                    </div>

                    {variants.length > 0 && (
                      <fieldset className="product-variants">
                        <legend>Оберіть упаковку</legend>
                        <div className="product-variant-list">
                          {variants.map((variant, index) => (
                            <button
                              type="button"
                              key={variant.id ?? `${variant.package}-${index}`}
                              className={`product-variant ${selectedVariant === index ? "product-variant-active" : ""}`}
                              onClick={() => setSelectedVariant(index)}
                              aria-pressed={selectedVariant === index}
                            >
                              <span>{variant.package ?? "Упаковка"}</span>
                              <span className="product-variant-prices">
                                <strong>{formatPrice(variant.price)}</strong>
                                {variant.oldPrice != null &&
                                  Number(variant.oldPrice) >
                                    Number(variant.price) && (
                                    <del>{formatPrice(variant.oldPrice)}</del>
                                  )}
                              </span>
                              {!!variant.discount && (
                                <small>−{variant.discount}%</small>
                              )}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <button type="button" className="product-add-to-cart">
                      <FiShoppingCart aria-hidden="true" />
                      Додати в кошик
                    </button>
                    {product.inProduction === false && (
                      <span className="product-unavailable">
                        Тимчасово немає в наявності
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {characteristics.length > 0 && (
                <section className="product-characteristics">
                  <div className="product-section-heading">
                    <span>Характеристики</span>
                    <h2>Основна інформація</h2>
                  </div>
                  <dl className="product-characteristics-grid">
                    {characteristics.map(([name, value]) => (
                      <div className="product-characteristic" key={name}>
                        <dt>{name}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {sections.length > 0 && (
                <section className="product-details">
                  <div className="product-section-heading">
                    <span>Інформація про товар</span>
                    <h2>Опис та рекомендації</h2>
                  </div>
                  <div className="product-accordions">
                    {sections.map((section) => {
                      const isOpen = openSections.includes(section.key);
                      return (
                        <article
                          className="product-accordion"
                          key={section.key}
                        >
                          <h3>
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={() => toggleSection(section.key)}
                            >
                              <span>{section.title}</span>
                              <FiChevronDown
                                className={
                                  isOpen ? "product-accordion-icon-open" : ""
                                }
                                aria-hidden="true"
                              />
                            </button>
                          </h3>
                          {isOpen && (
                            <div className="product-accordion-content">
                              {section.text
                                .split(/\n{2,}/)
                                .map((paragraph, index) => (
                                  <p key={`${section.key}-${index}`}>
                                    {paragraph}
                                  </p>
                                ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {reviews.length > 0 && (
                <section className="product-reviews" id="product-reviews">
                  <div className="product-section-heading">
                    <span>Досвід покупців</span>
                    <h2>Відгуки</h2>
                  </div>
                  <div className="product-review-list">
                    {reviews.map((review, index) => (
                      <article
                        className="product-review"
                        key={review.id ?? `${review.author}-${index}`}
                      >
                        <div className="product-review-heading">
                          <strong>{review.author || "Покупець"}</strong>
                          <span className="product-review-rating">
                            {"★".repeat(
                              Math.max(
                                0,
                                Math.min(5, Number(review.rating) || 0),
                              ),
                            )}
                          </span>
                          {review.date && (
                            <time dateTime={review.date}>{review.date}</time>
                          )}
                        </div>
                        {review.text && <p>{review.text}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : error ? (
            <div className="product-page-state product-page-state-error">
              <p>{error}</p>
              <button type="button" onClick={() => void loadProducts()}>
                <FiRefreshCw aria-hidden="true" />
                Спробувати ще раз
              </button>
            </div>
          ) : !isLoading ? (
            <div className="product-page-state">
              <h1>Товар не знайдено</h1>
              <p>Можливо, товар видалено або посилання застаріло.</p>
              <Link href="/catalog">Повернутися до каталогу</Link>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
