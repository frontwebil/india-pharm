"use client";

import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { Product } from "@/generated/prisma/browser";

const STORAGE_NAME = "india-pharm-cart";

export type CartItem = {
  productId: number;
  variantKey: string | null;
  packageName: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (
    productId: number,
    variantKey: string | null,
    packageName: string | null,
  ) => void;
  setQuantity: (
    productId: number,
    variantKey: string | null,
    packageName: string | null,
    quantity: number,
  ) => void;
  removeItem: (
    productId: number,
    variantKey: string | null,
    packageName: string | null,
  ) => void;
  reconcileProducts: (products: Product[]) => void;
};

type ProductVariantRecord = {
  id?: number | string;
  package?: string;
};

const cartStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;

    const stored = window.localStorage.getItem(name);
    if (stored !== null) {
      removeLegacyCookie(name);
      return stored;
    }

    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix));
    if (!entry) return null;

    const legacyValue = decodeURIComponent(entry.slice(prefix.length));
    window.localStorage.setItem(name, legacyValue);
    removeLegacyCookie(name);
    return legacyValue;
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(name, value);
    removeLegacyCookie(name);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(name);
    removeLegacyCookie(name);
  },
};

function removeLegacyCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;
  return (
    Number.isInteger(item.productId) &&
    (item.variantKey === null || typeof item.variantKey === "string") &&
    (item.packageName === null || typeof item.packageName === "string") &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0
  );
}

function getVariants(value: unknown): ProductVariantRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (variant): variant is ProductVariantRecord =>
      variant !== null && typeof variant === "object",
  );
}

function getVariantKey(variant: ProductVariantRecord) {
  if (variant.id !== null && variant.id !== undefined) {
    return String(variant.id);
  }

  return typeof variant.package === "string" ? variant.package : null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, variantKey, packageName) =>
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productId === productId &&
              item.variantKey === variantKey &&
              item.packageName === packageName,
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId, variantKey, packageName, quantity: 1 },
            ],
          };
        }),
      setQuantity: (productId, variantKey, packageName, quantity) =>
        set((state) => ({
          items:
            quantity > 0
              ? state.items.map((item) =>
                  item.productId === productId &&
                  item.variantKey === variantKey &&
                  item.packageName === packageName
                    ? { ...item, quantity: Math.floor(quantity) }
                    : item,
                )
              : state.items.filter(
                  (item) =>
                    item.productId !== productId ||
                    item.variantKey !== variantKey ||
                    item.packageName !== packageName,
                ),
        })),
      removeItem: (productId, variantKey, packageName) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              item.productId !== productId ||
              item.variantKey !== variantKey ||
              item.packageName !== packageName,
          ),
        })),
      reconcileProducts: (products) =>
        set((state) => {
          const productsById = new Map(
            products.map((product) => [product.id, product]),
          );
          const items = state.items
            .filter(isCartItem)
            .flatMap((item) => {
              const product = productsById.get(item.productId);
              if (!product) return [];

              const variants = getVariants(product.variants);
              if (variants.length === 0) {
                return item.variantKey === null ? [item] : [];
              }

              const variant = variants.find(
                (entry) =>
                  (item.variantKey !== null &&
                    getVariantKey(entry) === item.variantKey) ||
                  (item.packageName !== null &&
                    entry.package === item.packageName),
              );
              if (!variant) return [];

              return [
                {
                  ...item,
                  variantKey: getVariantKey(variant),
                  packageName:
                    typeof variant.package === "string"
                      ? variant.package
                      : item.packageName,
                },
              ];
            });

          return { items };
        }),
    }),
    {
      name: STORAGE_NAME,
      version: 1,
      storage: createJSONStorage(() => cartStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }) as CartState,
      merge: (persisted, current) => {
        const persistedItems = (persisted as { items?: unknown } | undefined)
          ?.items;

        return {
          ...current,
          items: Array.isArray(persistedItems)
            ? persistedItems.filter(isCartItem)
            : [],
        };
      },
    },
  ),
);
