"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import "./style.css";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";

const categories = [
  {
    title: "Чоловіче здоров'я",
    items: [
      ["Віагра", "/catalog/viagra"],
      ["Сіаліс", "/catalog/cialis"],
      ["Дапоксетин", "/catalog/dapoxetine"],
      ["Левітра", "/catalog/levitra"],
      ["Камагра", "/catalog/kamagra"],
      ["Вімакс", "/catalog/vimax"],
      ["Силденафіл", "/catalog/sildenafil"],
      ["Тадалафіл", "/catalog/tadalafil"],
      ["Варденафіл", "/catalog/vardenafil"],
      ["Аванафіл", "/catalog/avanafil"],
      ["Продовження сексу", "/catalog/prolongatory"],
    ],
  },
  {
    title: "Жіноче здоров'я",
    items: [
      ["Жіноча Віагра", "/catalog/woman-viagra"],
      ["Жіночі збудники", "/catalog/zhenskie-vozbuditeli"],
    ],
  },
  {
    title: "Інше",
    items: [
      ["Похудіння", "/catalog/preparaty-dlja-pohudenija"],
      ["БАДи", "/catalog/bady"],
      ["Від куріння", "/catalog/ot-kurenija"],
      ["Лубриканти", "/catalog/lubrikanty"],
    ],
  },
];

export function Header() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        catalogRef.current &&
        !catalogRef.current.contains(event.target as Node)
      ) {
        setIsCatalogOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    if (isCatalogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isCatalogOpen]);

  return (
    <>
      <header className="header">
        <div className="header-container" ref={catalogRef}>
          <Link href="/" className="header-logo-link">
            <Image
              src="/header-logo.webp"
              width={168}
              height={84}
              alt="India Pharm"
              className="header-logo"
            />
          </Link>

          <nav className="header-container-right">
            <div className="header-catalog-wrapper">
              <button
                type="button"
                className={`header-catalog ${
                  isCatalogOpen ? "header-catalog-active" : ""
                }`}
                onClick={() => setIsCatalogOpen((prev) => !prev)}
              >
                <span>Каталог</span>

                <span
                  className={`header-catalog-arrow ${
                    isCatalogOpen ? "header-catalog-arrow-open" : ""
                  }`}
                >
                  <IoIosArrowDown />
                </span>
              </button>

              {isCatalogOpen && (
                <div className="catalog-dropdown">
                  <div className="catalog-header">
                    <span>Категорії товарів</span>

                    <button
                      type="button"
                      className="catalog-close"
                      onClick={() => setIsCatalogOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <Link href={"/catalog"} className="catalog-category-all">
                    <h3>Усі категорії</h3>
                    <FaArrowRight />
                  </Link>

                  <div className="catalog-content">
                    {categories.map((category) => (
                      <div className="catalog-category" key={category.title}>
                        <h3>{category.title}</h3>

                        <div className="catalog-category-items">
                          {category.items.map(([title, href]) => (
                            <Link
                              href={href}
                              key={href}
                              onClick={() => setIsCatalogOpen(false)}
                            >
                              {title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href="#cart" className="header-cart">
              <span className="header-cart-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 4H5L7.4 15.2C7.5 15.7 8 16 8.5 16H18.5C19 16 19.4 15.7 19.6 15.2L21 9H6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                </svg>
              </span>

              <span>Кошик</span>

              <span className="header-cart-count">0</span>
            </a>
          </nav>
        </div>
      </header>
      <div className="div-header-space"></div>
    </>
  );
}
