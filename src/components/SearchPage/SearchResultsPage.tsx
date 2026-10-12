"use client";

import { useEffect, useMemo } from "react";

import { useProductsStore } from "@/store/productsStore";
import { Header } from "@/components/MainPage/Header/Header";
import { CatalogProducts } from "@/components/CatalogPage/CatalogProducts/CatalogProducts";
import "@/components/CatalogPage/style.css";

export function SearchResultsPage({ query }: { query: string }) {
  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoading);
  const error = useProductsStore((state) => state.error);
  const loadProducts = useProductsStore((state) => state.loadProducts);

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLocaleLowerCase("uk-UA");

  const matchingProducts = useMemo(
    () =>
      normalizedQuery
        ? products.filter((product) =>
            [
              product.name,
              product.description,
              product.shortDescription,
              product.category,
            ].some((value) =>
              value?.toLocaleLowerCase("uk-UA").includes(normalizedQuery),
            ),
          )
        : [],
    [normalizedQuery, products],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <>
      <Header />
      <main className="catalog-page">
        <div className="catalog-page-container">
          <h1 className="search-results-title">
            Результати пошуку за запитом &quot;{trimmedQuery}&quot;
          </h1>

          {isLoading ? (
            <p className="search-results-state">Завантажуємо товари...</p>
          ) : error ? (
            <p className="search-results-state search-results-error">{error}</p>
          ) : !normalizedQuery ? (
            <p className="search-results-state">
              Введіть запит, щоб знайти товари.
            </p>
          ) : matchingProducts.length > 0 ? (
            <CatalogProducts products={matchingProducts} />
          ) : (
            <p className="search-results-state">
              За цим запитом товарів не знайдено.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
