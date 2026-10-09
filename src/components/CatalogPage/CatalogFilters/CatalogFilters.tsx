"use client";

import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

import {
  FilterFacet,
  SelectedFilters,
  hasSelectedFilters,
} from "../characteristicFilters";

type CatalogFiltersProps = {
  facets: FilterFacet[];
  selectedFilters: SelectedFilters;
  onToggle: (key: string, value: string) => void;
  onReset: () => void;
};

export function CatalogFilters({
  facets,
  selectedFilters,
  onToggle,
  onReset,
}: CatalogFiltersProps) {
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>(
    {},
  );

  if (facets.length === 0) {
    return null;
  }

  const toggleAccordion = (key: string) => {
    setCollapsedKeys((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div className="catalog-filters">
      <div className="catalog-filters-header">
        <h2>Фільтри</h2>

        {hasSelectedFilters(selectedFilters) && (
          <button
            type="button"
            className="catalog-filters-reset"
            onClick={onReset}
          >
            Скинути
          </button>
        )}
      </div>

      {facets.map((facet) => {
        const isOpen = !collapsedKeys[facet.key];
        const selectedCount = selectedFilters[facet.key]?.length ?? 0;

        return (
          <div className="catalog-filter-accordion" key={facet.key}>
            <button
              type="button"
              className="catalog-filter-accordion-toggle"
              aria-expanded={isOpen}
              onClick={() => toggleAccordion(facet.key)}
            >
              <h3>
                {facet.key}
                {selectedCount > 0 && (
                  <span className="catalog-filter-selected-count">
                    {selectedCount}
                  </span>
                )}
              </h3>
              <IoIosArrowDown
                className={`catalog-filter-accordion-icon ${isOpen ? "open" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="catalog-sidebar-links catalog-filter-options">
                {facet.values.map((value) => {
                  const isActive = selectedFilters[facet.key]?.includes(value);

                  return (
                    <button
                      type="button"
                      key={value}
                      className={isActive ? "active" : ""}
                      onClick={() => onToggle(facet.key, value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
