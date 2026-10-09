import { Product } from "@/generated/prisma/browser";

import { ProductCard } from "../ProductCard/ProductCard";

type CatalogProductsProps = {
  products: Product[];
};

export function CatalogProducts({ products }: CatalogProductsProps) {
  return (
    <div className="catalog-products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
