"use client";

import Image from "next/image";
import { IoOptionsOutline } from "react-icons/io5";
import { CatalogSort } from "../CatalogSort/CatalogSort";

type SortOption = "default" | "price-asc" | "price-desc";

type CatalogHeadingProps = {
  onOpenFilters: () => void;
  sortOption: string;
  setSortOption: (SortOption: SortOption) => void;
};

export function CatalogHeading({
  onOpenFilters,
  sortOption,
  setSortOption,
}: CatalogHeadingProps) {
  return (
    <section className="catalog-page-heading">
      <div className="catalog-heading-banner">
        <Image
          src="/catalog-banner.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
          className="catalog-heading-image"
        />
        <div className="catalog-heading-overlay" />
        <div className="catalog-heading-content">
          <h1 className="catalog-page-title">Каталог товарів</h1>

          <div className="catalog-heading-delivery">
            <span>Безкоштовна доставка від 1000 грн</span>
          </div>
        </div>
      </div>
      <div className="buttons-flex">
        <button
          type="button"
          className="catalog-filter-toggle"
          onClick={onOpenFilters}
        >
          <IoOptionsOutline />
          Категорії
        </button>
        <div className="catalog-sort-mobile">
          <CatalogSort sortOption={sortOption} setSortOption={setSortOption} />
        </div>
      </div>
    </section>
  );
}
