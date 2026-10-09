"use client";

import { useEffect, useState } from "react";

import { useProductsStore } from "@/store/productsStore";

import "../style.css";
import { CatalogHeading } from "../CatalogHeading/CatalogHeading";
import { Header } from "@/components/MainPage/Header/Header";
import { CatalogResults } from "../CatalogResults/CatalogResults";
import { CatalogSidebar } from "../CatalogSidebar/CatalogSidebar";
import { categoryNames } from "../categories";

type SortOption = "default" | "price-asc" | "price-desc";

export function CategoryPage({ category }: { category: string }) {
  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoading);
  const error = useProductsStore((state) => state.error);
  const loadProducts = useProductsStore((state) => state.loadProducts);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>("default");

  const PRODUCTS_PER_PAGE = 36;

  const getProductPrice = (product: (typeof products)[number]) => {
    const minPrice = Number(product.minPricePerPill ?? 0);

    return minPrice > 0 ? minPrice : Number(product.price ?? 0);
  };

  const sortedProducts = [...products]
    .filter((product) => product.category === categoryNames[category])
    .sort((a, b) => Number(b.isTop) - Number(a.isTop));

  if (sortOption === "price-asc") {
    sortedProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sortOption === "price-desc") {
    sortedProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  }

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, totalPages)));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, category]);

  return (
    <>
      <Header />

      <main className="catalog-page">
        <div className="catalog-page-container">
          <CatalogHeading
            onOpenFilters={() => setIsFilterOpen(true)}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
          <div className="catalog-layout">
            <CatalogSidebar
              isOpen={isFilterOpen}
              productsCount={products.length}
              onClose={() => setIsFilterOpen(false)}
              products={products}
              category={category}
            />

            <CatalogResults
              category={category}
              products={sortedProducts}
              isLoading={isLoading}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              productsPerPage={PRODUCTS_PER_PAGE}
              onPageChange={setCurrentPage}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
          </div>
        </div>
      </main>
    </>
  );
}
