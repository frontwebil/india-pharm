"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";

import { CatalogFilters } from "../CatalogFilters/CatalogFilters";
import { categories } from "../categories";
import { FilterFacet, SelectedFilters } from "../characteristicFilters";

import { Product } from "@/generated/prisma/client";

type CatalogSidebarProps = {
  isOpen: boolean;
  productsCount: number;
  onClose: () => void;
  products: Product[];
  category?: string;
  facets?: FilterFacet[];
  selectedFilters?: SelectedFilters;
  onToggleFilter?: (key: string, value: string) => void;
  onResetFilters?: () => void;
};

export function CatalogSidebar({
  isOpen,
  onClose,
  category,
  facets = [],
  selectedFilters = {},
  onToggleFilter,
  onResetFilters,
}: CatalogSidebarProps) {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(!category);

  useEffect(() => {
    setIsCategoriesOpen(!category);
  }, [category]);

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
          {category ? (
            <button
              type="button"
              className="catalog-categories-toggle"
              aria-expanded={isCategoriesOpen}
              onClick={() => setIsCategoriesOpen((open) => !open)}
            >
              <h2>Категорії</h2>
              <IoIosArrowDown
                className={`catalog-filter-accordion-icon ${isCategoriesOpen ? "open" : ""}`}
              />
            </button>
          ) : (
            <h2>Категорії</h2>
          )}

          <button
            type="button"
            className="catalog-sidebar-close"
            aria-label="Закрити категорії"
            onClick={onClose}
          >
            <IoCloseOutline />
          </button>
        </div>

        {isCategoriesOpen && (
          <>
            <Link
              href="/catalog"
              className={`catalog-sidebar-all ${!category ? "active" : ""}`}
              onClick={onClose}
            >
              Усі товари
            </Link>

            <nav className="catalog-sidebar-nav">
              {categories.map((categoryGroup) => (
                <div
                  className="catalog-sidebar-group"
                  key={categoryGroup.title}
                >
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
          </>
        )}

        {category && onToggleFilter && onResetFilters && (
          <CatalogFilters
            facets={facets}
            selectedFilters={selectedFilters}
            onToggle={onToggleFilter}
            onReset={onResetFilters}
          />
        )}
      </aside>
    </>
  );
}
