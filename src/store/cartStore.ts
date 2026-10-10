"use client";

import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { Product } from "@/generated/prisma/browser";

const COOKIE_NAME = "india-pharm-cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

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

const cookieStorage: StateStorage = {
  getItem: (name) => {
    if (typeof document === "undefined") return null;

    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix));

    return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
  },
  setItem: (name, value) => {
    if (typeof document === "undefined") return;

    const cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (cookie.length > 3800) {
      throw new Error("Кошик завеликий для збереження в cookie.");
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${cookie}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;

    if (!document.cookie.split("; ").some((entry) => entry.startsWith(`${encodeURIComponent(name)}=`))) {
      throw new Error("Не вдалося зберегти кошик у cookie.");
    }
  },
  removeItem: (name) => {
    if (typeof document === "undefined") return;

    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
  },
};

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
      name: COOKIE_NAME,
      version: 1,
      storage: createJSONStorage(() => cookieStorage),
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
