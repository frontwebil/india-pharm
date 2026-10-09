"use client";

import { useEffect, useState } from "react";

import { Product } from "@/generated/prisma/browser";

import "./style.css";

import { Header } from "../MainPage/Header/Header";
import { CatalogHeading } from "./CatalogHeading/CatalogHeading";
import { CatalogSidebar } from "./CatalogSidebar/CatalogSidebar";
import { CatalogResults } from "./CatalogResults/CatalogResults";

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 36;
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

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

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, totalPages)));
  }, [totalPages]);

  return (
    <>
      <Header />
      <main className="catalog-page">
        <div className="catalog-page-container">
          <CatalogHeading onOpenFilters={() => setIsFilterOpen(true)} />

          <div className="catalog-layout">
            <CatalogSidebar
              isOpen={isFilterOpen}
              productsCount={products.length}
              onClose={() => setIsFilterOpen(false)}
              products={products}
            />

            <CatalogResults
              products={products}
              isLoading={isLoading}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              productsPerPage={PRODUCTS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </>
  );
}
