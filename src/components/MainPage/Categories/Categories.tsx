"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import "./style.css";

interface CategoryItem {
  title: string;
  href: string;
  image: string;
  price?: string;
  isPopular?: boolean;
}

const categories: CategoryItem[] = [
  {
    title: "Віагра",
    price: "від 10 грн / таб",
    href: "/catalog/viagra",
    image: "/categories/pictcat-18.webp",
    isPopular: true,
  },
  {
    title: "Сіаліс",
    price: "від 15 грн / таб",
    href: "/catalog/cialis",
    image: "/categories/pictcat-19.webp",
    isPopular: true,
  },
  {
    title: "Дапоксетин",
    price: "від 17 грн / таб",
    href: "/catalog/dapoxetine",
    image: "/categories/pictcat-22.webp",
  },
  {
    title: "Левітра",
    price: "від 12 грн / таб",
    href: "/catalog/levitra",
    image: "/categories/pictcat-20.webp",
  },
  {
    title: "Жіноча Віагра",
    price: "від 10 грн / таб",
    href: "/catalog/female-stimulants",
    image: "/categories/pictcat-23.webp",
  },
  {
    title: "Камагра",
    href: "/catalog/kamagra",
    image: "/categories/pictcat-21.webp",
  },
  {
    title: "Вімакс",
    href: "/catalog/vimax",
    image: "/categories/pictcat-24.webp",
  },
  // {
  //   title: "Жіночі збудники",
  //   href: "/catalog/female-stimulants",
  //   image: "https://india-pharm.com/content/category/25/pictcat-25.png",
  // },
  // {
  //   title: "Силденафіл",
  //   href: "/catalog/sildenafil",
  //   image: "https://india-pharm.com/content/category/26/pictcat-26.jpg",
  // },
  // {
  //   title: "Тадалафіл",
  //   href: "/catalog/tadalafil",
  //   image: "https://india-pharm.com/content/category/27/pictcat-27.jpg",
  // },
  // {
  //   title: "Варденафіл",
  //   href: "/catalog/vardenafil",
  //   image: "https://india-pharm.com/content/category/28/pictcat-28.jpg",
  // },
  {
    title: "Аванафіл",
    href: "/catalog/avanafil",
    image: "https://india-pharm.com/content/category/29/pictcat-29.jpg",
  },
];

export function Categories() {
  return (
    <section className="categories-section">
      <div className="categories-container">
        <div className="categories-header">
          <div>
            <span className="categories-badge">Каталог товарів</span>
            <h2 className="categories-title">Категорії</h2>
          </div>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <Link key={cat.title} href={cat.href} className="cat-card">
              {/* ЦІНА АБО БАДЖ ВГОРІ */}
              {cat.price && (
                <span className="cat-price-badge">{cat.price}</span>
              )}

              {/* ЗОБРАЖЕННЯ ТОВАРУ */}
              <div className="cat-image-wrapper">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  width={200}
                  height={140}
                  className="cat-image"
                />
              </div>

              {/* НАЗВА ТА СТРІЛКА */}
              <div className="cat-content">
                <h3 className="cat-title">{cat.title}</h3>
                <span className="cat-arrow">
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
