"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import "./style.css";
import { useEffect, useState } from "react";
import { Product } from "@/generated/prisma/browser";
import { ProductCard } from "@/components/CatalogPage/ProductCard/ProductCard";

export function CategoriesTopSales() {
  const [productsBestSeller, setProductsBestSeller] = useState<Product[]>([]);

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch("/api/products/top");

        if (!response.ok) {
          throw new Error("Не вдалося отримати товари");
        }

        const data = await response.json();

        setProductsBestSeller(data.products);
      } catch (error) {
        console.error("Помилка отримання хітів продажів:", error);
      }
    }

    getProducts();
  }, []);

  return (
    <section className="categories-section">
      <div className="categories-container">
        <div className="categories-header">
          <div>
            <span className="categories-badge"></span>
            <h2 className="categories-title">Хіти продажів</h2>
          </div>
        </div>

        <div className="top-products-grid">
          {productsBestSeller.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
