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
};

export function CatalogSidebar({
  isOpen,
  productsCount,
  onClose,
  products,
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

        <Link href="/catalog" className="catalog-sidebar-all" onClick={onClose}>
          Усі товари
          {productsCount > 0 && <span>{productsCount}</span>}
        </Link>

        <nav className="catalog-sidebar-nav">
          {categories.map((category) => (
            <div className="catalog-sidebar-group" key={category.title}>
              <h3>{category.title}</h3>

              <div className="catalog-sidebar-links">
                {category.items.map(([title, slug]) => (
                  <Link href={`/catalog/${slug}`} key={slug} onClick={onClose}>
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
