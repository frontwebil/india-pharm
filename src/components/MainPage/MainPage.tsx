"use client";

import { useTelegram } from "@/hooks/useTelegram";
import { useEffect, useState } from "react";
import { Header } from "./Header/Header";
import { Hero } from "./Hero/Hero";
import { Categories } from "./Categories/Categories";
import { CategoriesTopSales } from "./Categories/CategoriesTopSales";

interface Product {
  id: string;
  name: string;
  price: number;
  [key: string]: unknown;
}

export default function MainPage() {
  const { tg, user, queryId } = useTelegram();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tg) return;

    const getProducts = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "https://india-pharm.com/api.php?lang=ua&format=text",
          {
            headers: {
              "X-Api-Token": "03f55c2ca1ef6694c04c28e6371296e6f062aba6e3352d8a",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Products:", data);

        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, [tg]);

  if (!tg) {
    return null;
  }

  return (
    <main className="min-h-screenbg-white">
      <Header />
      <Hero />
      <Categories />
      <CategoriesTopSales />

      {/* <section className="rounded-xl border border-neutral-800 p-4">
        <h2 className="mb-4 text-lg font-semibold">Telegram User</h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="opacity-60">User ID:</span>{" "}
            {user?.id ?? "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Username:</span>{" "}
            {user?.username ? `@${user.username}` : "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">First name:</span>{" "}
            {user?.first_name ?? "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Last name:</span>{" "}
            {user?.last_name || "Немає даних"}
          </p>

          <p>
            <span className="opacity-60">Query ID:</span>{" "}
            {queryId ?? "Немає даних"}
          </p>
        </div>
      </section> */}

      {/* <section className="mt-4 flex-1">
        {loading && <p>Завантаження товарів...</p>}

        {!loading && (
          <pre className="overflow-auto text-xs">
            {JSON.stringify(products, null, 2)}
          </pre>
        )}
      </section> */}
    </main>
  );
}
