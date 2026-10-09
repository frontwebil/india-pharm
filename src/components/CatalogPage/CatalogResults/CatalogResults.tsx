import { Product } from "@/generated/prisma/browser";

import { CatalogProducts } from "../CatalogProducts/CatalogProducts";
import { CatalogPagination } from "../CatalogPagination/CatalogPagination";
import { CatalogSort } from "../CatalogSort/CatalogSort";
import { categoryNames } from "../categories";

type SortOption = "default" | "price-asc" | "price-desc";

type CatalogResultsProps = {
  products: Product[];
  isLoading: boolean;
  error: string;
  currentPage: number;
  totalPages: number;
  productsPerPage: number;
  onPageChange: (page: number) => void;
  sortOption: string;
  setSortOption: (SortOption: SortOption) => void;
  category: string;
};

export function CatalogResults({
  products,
  isLoading,
  error,
  currentPage,
  totalPages,
  productsPerPage,
  onPageChange,
  setSortOption,
  category,
  sortOption,
}: CatalogResultsProps) {
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  return (
    <section className="catalog-results">
      <div className="catalog-results-header">
        <div className="flex items-center gap-2.5">
          <h2>{!category ? "Усі товари" : categoryNames[category]}</h2>

          {!isLoading && !error && (
            <span className="catalog-results-count">
              {products.length} товарів
            </span>
          )}
        </div>
        <div className="catalog-results-header-pc">
          <CatalogSort sortOption={sortOption} setSortOption={setSortOption} />
        </div>
      </div>

      {isLoading ? (
        <div className="catalog-state">Завантажуємо товари...</div>
      ) : error ? (
        <div className="catalog-state catalog-state-error">{error}</div>
      ) : products.length === 0 ? (
        <div className="catalog-state">Товарів поки немає.</div>
      ) : (
        <>
          <CatalogProducts products={paginatedProducts} />

          {totalPages > 1 && (
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalProducts={products.length}
              productsPerPage={productsPerPage}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </section>
  );
}
