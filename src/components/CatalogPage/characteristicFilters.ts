import { Product } from "@/generated/prisma/browser";

export type SelectedFilters = Record<string, string[]>;

export type FilterFacet = {
  key: string;
  values: string[];
};

function addValue(
  result: Record<string, string[]>,
  key: string,
  value: unknown,
) {
  const trimmedKey = key.trim();

  if (!trimmedKey || value == null || value === "") {
    return;
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("value" in value || "val" in value || "text" in value)
  ) {
    const nested = value as Record<string, unknown>;
    addValue(result, trimmedKey, nested.value ?? nested.val ?? nested.text);
    return;
  }

  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (item == null || typeof item === "object") {
      continue;
    }

    const trimmedValue = String(item).trim();

    if (!trimmedValue) {
      continue;
    }

    if (!result[trimmedKey]) {
      result[trimmedKey] = [];
    }

    if (!result[trimmedKey].includes(trimmedValue)) {
      result[trimmedKey].push(trimmedValue);
    }
  }
}

function parseCharacteristicItem(
  result: Record<string, string[]>,
  item: unknown,
) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return;
  }

  const record = item as Record<string, unknown>;
  const key = record.name ?? record.key ?? record.title ?? record.label;
  const value = record.value ?? record.val ?? record.text;

  if (typeof key !== "string") {
    return;
  }

  addValue(result, key, value);
}

export function parseCharacteristics(
  raw: Product["characteristics"],
): Record<string, string[]> {
  if (typeof raw === "string") {
    try {
      return parseCharacteristics(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  if (!raw || typeof raw !== "object") {
    return {};
  }

  const result: Record<string, string[]> = {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      parseCharacteristicItem(result, item);
    }

    return result;
  }

  const record = raw as Record<string, unknown>;
  const nestedList = record.characteristics ?? record.items ?? record.attrs;

  if (Array.isArray(nestedList)) {
    for (const item of nestedList) {
      parseCharacteristicItem(result, item);
    }

    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  const entries = Object.entries(record);
  const looksLikeList = entries.every(
    ([key, value]) => /^\d+$/.test(key) && value != null && typeof value === "object",
  );

  if (looksLikeList) {
    for (const [, item] of entries) {
      parseCharacteristicItem(result, item);
    }

    return result;
  }

  for (const [key, value] of entries) {
    addValue(result, key, value);
  }

  return result;
}

function isExcludedFilterKey(key: string) {
  return (
    /кіл(?:-сть|ькість).*упаков/i.test(key) ||
    /назва препарату/i.test(key)
  );
}

function compareFilterValues(a: string, b: string) {
  const aNumber = Number(a.replace(",", "."));
  const bNumber = Number(b.replace(",", "."));

  if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
    return aNumber - bNumber;
  }

  return a.localeCompare(b, "uk");
}

export function buildFilterFacets(products: Product[]): FilterFacet[] {
  const valuesByKey = new Map<string, Set<string>>();

  for (const product of products) {
    const characteristics = parseCharacteristics(product.characteristics);

    for (const [key, values] of Object.entries(characteristics)) {
      let bucket = valuesByKey.get(key);

      if (!bucket) {
        bucket = new Set();
        valuesByKey.set(key, bucket);
      }

      for (const value of values) {
        bucket.add(value);
      }
    }
  }

  return [...valuesByKey.entries()]
    .map(([key, values]) => ({
      key,
      values: [...values].sort(compareFilterValues),
    }))
    .filter(
      (facet) => facet.values.length > 1 && !isExcludedFilterKey(facet.key),
    )
    .sort((a, b) => a.key.localeCompare(b.key, "uk"));
}

export function productMatchesFilters(
  product: Product,
  selectedFilters: SelectedFilters,
) {
  const characteristics = parseCharacteristics(product.characteristics);

  for (const [key, selectedValues] of Object.entries(selectedFilters)) {
    if (selectedValues.length === 0) {
      continue;
    }

    const productValues = characteristics[key] ?? [];
    const matches = selectedValues.some((value) =>
      productValues.includes(value),
    );

    if (!matches) {
      return false;
    }
  }

  return true;
}

export function toggleFilterValue(
  selectedFilters: SelectedFilters,
  key: string,
  value: string,
): SelectedFilters {
  const current = selectedFilters[key] ?? [];
  const nextValues = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  if (nextValues.length === 0) {
    const { [key]: _, ...rest } = selectedFilters;

    return rest;
  }

  return {
    ...selectedFilters,
    [key]: nextValues,
  };
}

export function hasSelectedFilters(selectedFilters: SelectedFilters) {
  return Object.values(selectedFilters).some((values) => values.length > 0);
}
