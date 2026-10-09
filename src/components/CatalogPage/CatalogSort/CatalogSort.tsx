import "./style.css";

type SortOption = "default" | "price-asc" | "price-desc";

type CatalogResultsProps = {
  sortOption: string;
  setSortOption: (option: SortOption) => void;
};

export function CatalogSort({
  sortOption,
  setSortOption,
}: CatalogResultsProps) {
  return (
    <div className="catalog-sort">
      <label htmlFor="catalog-sort-select">Сортування:</label>

      <select
        id="catalog-sort-select"
        value={sortOption}
        onChange={(event) => setSortOption(event.target.value as SortOption)}
      >
        <option value="default">За замовчуванням</option>
        <option value="price-asc">Від дешевих до дорогих</option>
        <option value="price-desc">Від дорогих до дешевих</option>
      </select>
    </div>
  );
}
