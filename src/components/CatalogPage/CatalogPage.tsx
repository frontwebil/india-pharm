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
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 36;

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const paginatedProducts = products.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE,
  );

  const paginationPages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((page) => {
    if (totalPages <= 5) return true;

    if (currentPage <= 3) {
      return page <= 3 || page === totalPages;
    }

    if (currentPage >= totalPages - 2) {
      return page === 1 || page >= totalPages - 2;
    }

    return (
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
    );
  });

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    document.querySelector(".catalog-page-heading")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, totalPages)));
  }, [totalPages]);

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
              <>
                <div className="catalog-products-grid">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="catalog-pagination">
                    <span className="catalog-pagination-info">
                      Показано {startIndex + 1}–
                      {Math.min(
                        startIndex + PRODUCTS_PER_PAGE,
                        products.length,
                      )}{" "}
                      із {products.length}
                    </span>

                    <div className="catalog-pagination-controls">
                      <button
                        type="button"
                        className="catalog-page-button"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Попередня сторінка"
                      >
                        ←
                      </button>

                      {paginationPages.map((page, index) => {
                        const previousPage = paginationPages[index - 1];
                        const showDots =
                          previousPage && page - previousPage > 1;

                        return (
                          <>
                            {showDots && (
                              <span className="catalog-pagination-dots">
                                ...
                              </span>
                            )}
                            <span
                              key={page}
                              className="catalog-pagination-item"
                            >
                              <button
                                type="button"
                                className={`catalog-page-button ${
                                  currentPage === page
                                    ? "catalog-page-button-active"
                                    : ""
                                }`}
                                aria-current={
                                  currentPage === page ? "page" : undefined
                                }
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </span>
                          </>
                        );
                      })}

                      <button
                        type="button"
                        className="catalog-page-button"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Наступна сторінка"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
