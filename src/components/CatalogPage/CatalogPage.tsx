"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IoOptionsOutline, IoCloseOutline } from "react-icons/io5";
import { Product } from "@/generated/prisma/browser";
import "./style.css";
import { ProductCard } from "./ProductCard/ProductCard";

const categories = [
  {
    title: "Чоловіче здоров'я",
    items: [
      ["Віагра", "viagra"],
      ["Сіаліс", "cialis"],
      ["Дапоксетин", "dapoxetine"],
      ["Левітра", "levitra"],
      ["Камагра", "kamagra"],
      ["Вімакс", "vimax"],
      ["Силденафіл", "sildenafil"],
      ["Тадалафіл", "tadalafil"],
      ["Варденафіл", "vardenafil"],
      ["Аванафіл", "avanafil"],
      ["Продовження сексу", "prolongatory"],
    ],
  },
  {
    title: "Жіноче здоров'я",
    items: [
      ["Жіноча Віагра", "woman-viagra"],
      ["Жіночі збудники", "zhenskie-vozbuditeli"],
    ],
  },
  {
    title: "Інше",
    items: [
      ["Похудіння", "preparaty-dlja-pohudenija"],
      ["БАДи", "bady"],
      ["Від куріння", "ot-kurenija"],
      ["Лубриканти", "lubrikanty"],
    ],
  },
];

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch("/api/products/get-all");

        if (!response.ok) {
          throw new Error("Не вдалося завантажити товари");
        }

        const data = await response.json();

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        console.error("Помилка завантаження каталогу:", error);
        setError("Не вдалося завантажити каталог. Спробуйте пізніше.");
      } finally {
        setIsLoading(false);
      }
    }

    getProducts();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  return (
    <main className="catalog-page">
      <div className="catalog-page-container">
        <div className="catalog-page-heading">
          <div>
            <h1 className="catalog-page-title">Каталог товарів</h1>
            <p className="catalog-page-description">
              Оберіть потрібну категорію та перегляньте доступні товари.
            </p>
          </div>
          <button
            type="button"
            className="catalog-filter-toggle"
            onClick={() => setIsFilterOpen(true)}
          >
            <IoOptionsOutline />
            Категорії
          </button>
        </div>
        <div className="catalog-layout">
          {isFilterOpen && (
            <button
              type="button"
              className="catalog-filter-overlay"
              aria-label="Закрити фільтр"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          <aside
            className={`catalog-sidebar ${
              isFilterOpen ? "catalog-sidebar-open" : ""
            }`}
          >
            <div className="catalog-sidebar-header">
              <h2>Категорії</h2>

              <button
                type="button"
                className="catalog-sidebar-close"
                aria-label="Закрити категорії"
                onClick={() => setIsFilterOpen(false)}
              >
                <IoCloseOutline />
              </button>
            </div>

            <Link
              href="/catalog"
              className="catalog-sidebar-all"
              onClick={() => setIsFilterOpen(false)}
            >
              Усі товари
              {products.length > 0 && <span>{products.length}</span>}
            </Link>

            <nav className="catalog-sidebar-nav">
              {categories.map((category) => (
                <div className="catalog-sidebar-group" key={category.title}>
                  <h3>{category.title}</h3>

                  <div className="catalog-sidebar-links">
                    {category.items.map(([title, slug]) => (
                      <Link
                        href={`/catalog/${slug}`}
                        key={slug}
                        onClick={() => setIsFilterOpen(false)}
                      >
                        {title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <section className="catalog-results">
            <div className="catalog-results-header">
              <h2>Усі товари</h2>

              {!isLoading && !error && (
                <span className="catalog-results-count">
                  {products.length} товарів
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="catalog-state">Завантажуємо товари...</div>
            ) : error ? (
              <div className="catalog-state catalog-state-error">{error}</div>
            ) : products.length === 0 ? (
              <div className="catalog-state">Товарів поки немає.</div>
            ) : (
              <div className="catalog-products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
