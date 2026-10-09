"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/generated/prisma/browser";

const CACHE_TTL = 1 * 60 * 60 * 1000;

type ProductsState = {
  products: Product[];
  lastFetchedAt: number;
  isLoading: boolean;
  error: string;

  loadProducts: () => Promise<void>;
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      lastFetchedAt: 0,
      isLoading: false,
      error: "",

      loadProducts: async () => {
        await useProductsStore.persist.rehydrate();

        const { products, lastFetchedAt } = get();

        const isCacheValid =
          products.length > 0 &&
          lastFetchedAt > 0 &&
          Date.now() - lastFetchedAt < CACHE_TTL;

        if (isCacheValid) {
          set({ isLoading: false, error: "" });
          return;
        }

        set({ isLoading: true, error: "" });

        try {
          const response = await fetch("/api/products/get-all");

          if (!response.ok) {
            throw new Error("Не вдалося завантажити товари");
          }

          const data = await response.json();

          if (!Array.isArray(data.products)) {
            throw new Error("Некоректний формат відповіді API");
          }

          set({
            products: data.products as Product[],
            lastFetchedAt: Date.now(),
            error: "",
          });
        } catch (error) {
          console.error("Помилка завантаження каталогу:", error);

          if (get().products.length === 0) {
            set({
              error: "Не вдалося завантажити каталог. Спробуйте пізніше.",
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "india-pharm-products",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,

      partialize: (state) => ({
        products: state.products,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);
