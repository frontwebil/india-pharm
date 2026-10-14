"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaLock,
  FaTruck,
  FaGift,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";
import { TELEGRAM_BOT_URL } from "@/config/telegram";
import "./style.css";

type LocationInfo = {
  country: string;
  region: string;
  ip: string;
  language: string;
};

export function Hero() {
  // const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  // useEffect(() => {
  //   const fetchLocation = async () => {
  //     try {
  //       const response = await fetch("/api/location", {
  //         cache: "no-store",
  //       });

  //       if (!response.ok) {
  //         return;
  //       }

  //       const data = (await response.json()) as LocationInfo;
  //       setLocationInfo(data);
  //     } catch (error) {
  //       console.error("Location fetch failed", error);
  //     }
  //   };

  //   fetchLocation();
  // }, []);
  return (
    <section className="hero">
      <div className="hero-banner">
        <Image
          src="/hero-img.webp"
          alt="Препарати для чоловічого та жіночого здоров'я"
          fill
          priority
          className="hero-banner-img desktop-only"
        />
        <Image
          src="/hero-img-mobile.webp"
          alt="Препарати для чоловічого та жіночого здоров'я"
          fill
          priority
          className="hero-banner-img mobile-only"
        />
        <div className="hero-banner-overlay" />

        <div className="hero-banner-content">
          {/* <div className="hero-badge">
            <span> Конфіденційно & Анонімно</span>
          </div> */}

          <h1 className="hero-title">
            Відновіть впевненість та пристрасть у стосунках
          </h1>

          <p className="hero-subtitle">
            Сертифіковані препарати та дженерики для чоловічого та жіночого
            здоров{`'`}я з гарантією якості та швидкою доставкою.
          </p>

          {/* {locationInfo && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-sm">
              <div className="font-semibold">Тестове визначення країни:</div>
              <div>Країна: {locationInfo.country}</div>
              <div>Регіон: {locationInfo.region}</div>
              <div>IP: {locationInfo.ip}</div>
              <div>Мова: {locationInfo.language}</div>
            </div>
          )} */}

          <div className="hero-actions">
            <Link href="/catalog" className="hero-btn-primary">
              <span>Перейти в каталог</span>
              <FaArrowRight />
            </Link>

            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn-secondary"
            >
              Анонімна консультація
            </a>
          </div>
        </div>
      </div>

      <div className="hero-trust-bar">
        <div className="hero-trust-container">
          <div className="trust-card">
            <div className="trust-icon trust-icon-lock">
              <FaLock />
            </div>
            <div className="trust-text">
              <h3>100% Анонімно</h3>
              <p>Без розпізнавальних написів на коробці</p>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon trust-icon-truck">
              <FaTruck />
            </div>
            <div className="trust-text">
              <h3>Безкоштовна доставка</h3>
              <p>Для замовлень від 1000 грн</p>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon trust-icon-gift">
              <FaGift />
            </div>
            <div className="trust-text">
              <h3>Бонус кожному</h3>
              <p>Тестова таблетка на ваш вибір</p>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon trust-icon-shield">
              <FaShieldAlt />
            </div>
            <div className="trust-text">
              <h3>Гарантія результату</h3>
              <p>Або повернемо гроші за замовлення</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
