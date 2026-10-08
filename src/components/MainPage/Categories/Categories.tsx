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
    href: "/catalog",
    image: "https://india-pharm.com/content/category/18/pictcat-18.png",
    isPopular: true,
  },
  {
    title: "Сіаліс",
    price: "від 15 грн / таб",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/19/pictcat-19.png",
    isPopular: true,
  },
  {
    title: "Дапоксетин",
    price: "від 17 грн / таб",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/22/pictcat-22.png",
  },
  {
    title: "Левітра",
    price: "від 12 грн / таб",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/20/pictcat-20.png",
  },
  {
    title: "Жіноча Віагра",
    price: "від 10 грн / таб",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/23/pictcat-23.png",
  },
  {
    title: "Камагра",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/21/pictcat-21.png",
  },
  {
    title: "Вімакс",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/24/pictcat-24.png",
  },
  {
    title: "Жіночі збудники",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/25/pictcat-25.png",
  },
  {
    title: "Силденафіл",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/26/pictcat-26.jpg",
  },
  {
    title: "Тадалафіл",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/27/pictcat-27.jpg",
  },
  {
    title: "Варденафіл",
    href: "/catalog",
    image: "https://india-pharm.com/content/category/28/pictcat-28.jpg",
  },
  {
    title: "Аванафіл",
    href: "/catalog",
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
