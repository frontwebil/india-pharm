"use client";

import { IoOptionsOutline } from "react-icons/io5";

type CatalogHeadingProps = {
  onOpenFilters: () => void;
};

export function CatalogHeading({ onOpenFilters }: CatalogHeadingProps) {
  return (
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
        onClick={onOpenFilters}
      >
        <IoOptionsOutline />
        Категорії
      </button>
    </div>
  );
}
