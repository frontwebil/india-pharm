"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { Product } from "@/generated/prisma/browser";
import "./style.css";

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

export function ProductCard({ product}: ProductCardProps) {
  const images = Array.isArray(product.images) ? product.images : [];

  const image = images.find((item): item is string => typeof item === "string");

  const price = product.minPricePerPill
    ? Number(product.minPricePerPill)
    : Number(product.price);

  return (
    <Link href="/catalog" className="top-product-card">
      {product.isTop && <span className="cat-price-badge">Хіт продажу </span>}
      <div>
        <div className="top-product-image-wrapper">
          {image && (
            <Image
              src={image}
              alt={product.name}
              width={200}
              height={160}
              className="top-product-image"
            />
          )}
        </div>

        <div className="top-product-info">
          <span className="top-product-category">{product.category}</span>

          <h3 className="top-product-title">{product.name}</h3>
        </div>
      </div>
      <div className="top-product-bottom">
        <span className="top-product-price">Від {price} грн за таблетку</span>

        <span className="top-product-arrow">
          <FaArrowRight />
        </span>
      </div>
    </Link>
  );
}
