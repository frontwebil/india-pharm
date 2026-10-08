"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import "./style.css";
import { useEffect, useState } from "react";
import { Product } from "@/generated/prisma/browser";

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
            <Link key={product.id} href="/catalog" className="top-product-card">
              {product.isTop && (
                <span className="cat-price-badge">Хіт продажу</span>
              )}
              <div className="">
                <div className="top-product-image-wrapper">
                  <Image
                    src={product.images?.[0] as string}
                    alt={product.name}
                    width={200}
                    height={160}
                    className="top-product-image"
                  />
                </div>

                <div className="top-product-info">
                  <span className="top-product-category">
                    {product.category}
                  </span>

                  <h3 className="top-product-title">{product.name}</h3>
                </div>
              </div>
              <div className="top-product-bottom">
                <span className="top-product-price">
                  Від{" "}
                  {product.minPricePerPill
                    ? `${Number(product.minPricePerPill)} грн`
                    : `${Number(product.price)} грн`}{" "}
                  за таблетку
                </span>

                <span className="top-product-arrow">
                  <FaArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
