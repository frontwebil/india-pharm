"use client";

import { Header } from "./Header/Header";
import { Hero } from "./Hero/Hero";
import { Categories } from "./Categories/Categories";
import { CategoriesTopSales } from "./Categories/CategoriesTopSales";

export default function MainPage() {
  return (
    <main className="min-h-screenbg-white">
      <Header />
      <Hero />
      <Categories />
      <CategoriesTopSales />
    </main>
  );
}
