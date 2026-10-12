type CheckoutContactSectionProps = {
  phoneError: boolean;
};

export function CheckoutContactSection({
  phoneError,
}: CheckoutContactSectionProps) {
  return (
    <section className="checkout-section">
      <div className="checkout-section-heading">
        <span className="checkout-section-number">01</span>
        <div>
          <h2>Контактні дані</h2>
          <p>Як до вас звертатися та як з вами зв’язатися</p>
        </div>
      </div>

      <div className="checkout-fields">
        <label className="checkout-field">
          <span>
            Ім’я <small>(необов’язково)</small>
          </span>
          <input
            autoComplete="given-name"
            name="name"
            placeholder="Наприклад, Іван"
          />
        </label>
        <label
          className={`checkout-field${phoneError ? " checkout-field-error" : ""}`}
        >
          <span>
            Телефон <small>(обов’язково)</small>
          </span>
          <input
            autoComplete="tel"
            aria-invalid={phoneError}
            inputMode="tel"
            name="phone"
            placeholder="+380 __ ___ __ __"
            required
            type="tel"
          />
        </label>
      </div>
    </section>
  );
}
