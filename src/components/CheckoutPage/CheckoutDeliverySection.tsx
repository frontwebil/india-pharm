import { NovaPoshtaFields } from "@/components/CheckoutPage/NovaPoshtaFields";

type DeliveryPointType = "branch" | "postomat";

type CheckoutDeliverySectionProps = {
  selectedDelivery: string;
  onDeliveryChange: (delivery: string) => void;
  deliveryPointType: DeliveryPointType;
  onDeliveryPointTypeChange: (type: DeliveryPointType) => void;
  addressError: boolean;
};

export function CheckoutDeliverySection({
  selectedDelivery,
  onDeliveryChange,
  deliveryPointType,
  onDeliveryPointTypeChange,
  addressError,
}: CheckoutDeliverySectionProps) {
  return (
    <section className="checkout-section">
      <div className="checkout-section-heading">
        <span className="checkout-section-number">02</span>
        <div>
          <h2>Доставка та оплата</h2>
          <p>Оберіть зручний для вас спосіб</p>
        </div>
      </div>

      <fieldset className="checkout-choice-group">
        <legend>Тип доставки</legend>
        <div className="checkout-choice-options">
          <label className="checkout-choice">
            <input
              checked={selectedDelivery === "nova-poshta"}
              name="delivery"
              onChange={(event) => onDeliveryChange(event.target.value)}
              type="radio"
              value="nova-poshta"
            />
            <span className="checkout-radio-mark" />
            <span className="checkout-choice-copy">
              <strong>Нова пошта</strong>
              <small>У відділення або поштомат</small>
            </span>
          </label>
          <label className="checkout-choice">
            <input
              checked={selectedDelivery === "ukrposhta"}
              name="delivery"
              onChange={(event) => onDeliveryChange(event.target.value)}
              type="radio"
              value="ukrposhta"
            />
            <span className="checkout-radio-mark" />
            <span className="checkout-choice-copy">
              <strong>Укрпошта</strong>
              <small>Доставка у відділення</small>
            </span>
          </label>
        </div>
      </fieldset>

      {selectedDelivery === "nova-poshta" && (
        <fieldset className="checkout-choice-group">
          <legend>Тип доставки Новою поштою</legend>
          <div className="checkout-choice-options">
            <label className="checkout-choice">
              <input
                checked={deliveryPointType === "branch"}
                name="deliveryPointType"
                onChange={() => onDeliveryPointTypeChange("branch")}
                type="radio"
                value="branch"
              />
              <span className="checkout-radio-mark" />
              <span className="checkout-choice-copy">
                <strong>Відділення</strong>
                <small>Доставка у відділення Нової пошти</small>
              </span>
            </label>
            <label className="checkout-choice">
              <input
                checked={deliveryPointType === "postomat"}
                name="deliveryPointType"
                onChange={() => onDeliveryPointTypeChange("postomat")}
                type="radio"
                value="postomat"
              />
              <span className="checkout-radio-mark" />
              <span className="checkout-choice-copy">
                <strong>Поштомат</strong>
                <small>Доставка у поштомат Нової пошти</small>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {selectedDelivery &&
        (selectedDelivery === "nova-poshta" ? (
          <div
            className={`checkout-address-field${addressError ? " checkout-field-error" : ""}`}
          >
            <NovaPoshtaFields
              deliveryPointType={deliveryPointType}
              invalid={addressError}
            />
          </div>
        ) : (
          <label
            className={`checkout-field checkout-field-full checkout-address-field${addressError ? " checkout-field-error" : ""}`}
          >
            <span>Адреса доставки</span>
            <textarea
              autoComplete="street-address"
              aria-invalid={addressError}
              name="adress"
              placeholder="Місто та номер або адреса відділення"
              required
              rows={3}
            />
          </label>
        ))}

      <fieldset className="checkout-choice-group">
        <legend>Оплата</legend>
        <div className="checkout-choice-options">
          <label className="checkout-choice">
            <input name="payment" type="radio" value="cash-on-delivery" />
            <span className="checkout-radio-mark" />
            <span className="checkout-choice-copy">
              <strong>Післяплата</strong>
              <small>Оплата при отриманні</small>
            </span>
          </label>
          <label className="checkout-choice">
            <input name="payment" type="radio" value="bank-transfer" />
            <span className="checkout-radio-mark" />
            <span className="checkout-choice-copy">
              <strong>Оплата на рахунок</strong>
              <small>Реквізити надасть менеджер</small>
            </span>
          </label>
        </div>
      </fieldset>
    </section>
  );
}
