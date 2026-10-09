"use client";

import Image from "next/image";
import { IoOptionsOutline } from "react-icons/io5";

type CatalogHeadingProps = {
  onOpenFilters: () => void;
};

export function CatalogHeading({ onOpenFilters }: CatalogHeadingProps) {
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
      <button
        type="button"
        className="catalog-filter-toggle"
        onClick={onOpenFilters}
      >
        <IoOptionsOutline />
        Категорії
      </button>
    </section>
  );
}
