"use client";

import Link from "next/link";

import { IoCloseOutline } from "react-icons/io5";

import { categories } from "../categories";

import { Product } from "@/generated/prisma/client";

type CatalogSidebarProps = {
  isOpen: boolean;
  productsCount: number;
  onClose: () => void;
  products: Product[];
  category?: string;
};

export function CatalogSidebar({
  isOpen,
  productsCount,
  onClose,
  category,
}: CatalogSidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="catalog-filter-overlay"
          aria-label="Закрити фільтр"
          onClick={onClose}
        />
      )}

      <aside
        className={`catalog-sidebar ${isOpen ? "catalog-sidebar-open" : ""}`}
      >
        <div className="catalog-sidebar-header">
          <h2>Категорії</h2>

          <button
            type="button"
            className="catalog-sidebar-close"
            aria-label="Закрити категорії"
            onClick={onClose}
          >
            <IoCloseOutline />
          </button>
        </div>

        <Link
          href="/catalog"
          className={`catalog-sidebar-all ${!category ? "active" : ""}`}
          onClick={onClose}
        >
          Усі товари
          {/* {productsCount > 0 && <span>{productsCount}</span>} */}
        </Link>

        <nav className="catalog-sidebar-nav">
          {categories.map((categoryGroup) => (
            <div className="catalog-sidebar-group" key={categoryGroup.title}>
              <h3>{categoryGroup.title}</h3>

              <div className="catalog-sidebar-links">
                {categoryGroup.items.map(([title, slug]) => (
                  <Link
                    className={slug === category ? "active" : ""}
                    href={`/catalog/${slug}`}
                    key={slug}
                    onClick={onClose}
                  >
                    {title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
