"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useCartStore } from "@/store/cartStore";
import { useProductsStore } from "@/store/productsStore";
import { useRouter } from "next/navigation";

export function CartOrderButton() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const reconcileProducts = useCartStore((state) => state.reconcileProducts);
  const products = useProductsStore((state) => state.products);
  const lastFetchedAt = useProductsStore((state) => state.lastFetchedAt);
  const loadProducts = useProductsStore((state) => state.loadProducts);
  const { tg } = useTelegram();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function initializeCart() {
      try {
        await useCartStore.persist.rehydrate();
        await loadProducts();
        const catalogState = useProductsStore.getState();
        if (
          catalogState.products.length > 0 ||
          catalogState.lastFetchedAt > 0
        ) {
          reconcileProducts(catalogState.products);
        }
        if (isCurrent) setIsReady(true);
      } catch (error) {
        console.error("Не вдалося відновити кошик:", error);
        if (isCurrent) setIsReady(true);
      }
    }

    void initializeCart();

    return () => {
      isCurrent = false;
    };
  }, [loadProducts, reconcileProducts]);

  useEffect(() => {
    if (isReady && (products.length > 0 || lastFetchedAt > 0)) {
      reconcileProducts(products);
    }
  }, [isReady, lastFetchedAt, products, reconcileProducts]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (!tg) return;

    const mainButton = tg.MainButton;

    if (isReady && itemCount > 0) {
      mainButton.setText("Оформити замовлення");
      mainButton.show();
      mainButton.onClick(handleCheckout);
    } else {
      mainButton.hide();
    }

    function handleCheckout() {
      router.push("/checkout");
    }

    return () => {
      mainButton.offClick(handleCheckout);
    };
  }, [isReady, itemCount, tg, router]);

  return null;
}
