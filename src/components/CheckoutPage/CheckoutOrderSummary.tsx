"use client";

import Image from "next/image";
import { FiLock, FiPackage } from "react-icons/fi";

export type CheckoutSummaryItem = {
  productId: number;
  variantKey?: string | null;
  packageName?: string | null;
  image?: string;
  name: string;
  selectedVariant: string;
  quantity: number;
  price: number;
};

type CheckoutOrderSummaryProps = {
  items: CheckoutSummaryItem[];
  total: number;
  isSubmitting: boolean;
  onLocalTestRequest: () => void;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн`;
}

export function CheckoutOrderSummary({
  items,
  total,
  isSubmitting,
  onLocalTestRequest,
}: CheckoutOrderSummaryProps) {
  return (
    <aside className="checkout-summary">
      <div className="checkout-summary-heading">
        <div className="checkout-summary-icon">
          <FiPackage aria-hidden="true" />
        </div>
        <div>
          <h2>Ваше замовлення</h2>
          <span>
            {items.reduce((sum, item) => sum + item.quantity, 0)} товар(и)
          </span>
        </div>
      </div>

      <div className="checkout-order-items">
        {items.map((item) => (
          <div
            className="checkout-order-item"
            key={`${item.productId}-${item.variantKey}-${item.packageName}`}
          >
            <div className="checkout-product-image">
              {item.image ? (
                <Image
                  alt=""
                  height={64}
                  src={item.image}
                  unoptimized
                  width={64}
                />
              ) : (
                <FiPackage aria-hidden="true" />
              )}
            </div>
            <div className="checkout-product-details">
              <strong>{item.name}</strong>
              {item.packageName && <small>{item.packageName}</small>}
              <span>
                {item.quantity} × {formatPrice(item.price)}
              </span>
            </div>
            <strong className="checkout-item-total">
              {formatPrice(item.price * item.quantity)}
            </strong>
          </div>
        ))}
      </div>

      <div className="checkout-total">
        <span>Разом до сплати</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      <div className="checkout-summary-note">
        <FiLock aria-hidden="true" />
        <p>Ваші дані потрібні лише для оформлення доставки.</p>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="checkout-local-test">
          <button
            className="checkout-local-test-button"
            disabled={isSubmitting}
            onClick={onLocalTestRequest}
            type="button"
          >
            Тестовий запит на localhost
          </button>
          <p>
            Для локальної перевірки без валідації форми та Telegram. Кошик не
            очищається.
          </p>
        </div>
      )}
    </aside>
  );
}
