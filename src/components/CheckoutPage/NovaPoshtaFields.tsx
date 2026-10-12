"use client";

import { useEffect, useState } from "react";

type DeliveryPointType = "branch" | "postomat";

type CityOption = {
  Ref: string;
  Description: string;
  Present?: string;
  AreaDescription?: string;
  SettlementTypeDescription?: string;
};

type WarehouseOption = {
  Ref: string;
  Description: string;
  CategoryOfWarehouse?: string;
};

type NovaPoshtaResponse<T> = {
  success?: boolean;
  data?: T[];
  errors?: string[];
};

type NovaPoshtaFieldsProps = {
  deliveryPointType: DeliveryPointType;
  invalid: boolean;
};

async function lookupNovaPoshta<T>(
  body: Record<string, string>,
  signal: AbortSignal,
): Promise<T[]> {
  const response = await fetch("/api/novaposhta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const result = (await response.json()) as NovaPoshtaResponse<T>;
  if (!response.ok || !result.success || !Array.isArray(result.data)) {
    throw new Error(
      result.errors?.join(" ") || "Не вдалося отримати дані Нової пошти.",
    );
  }

  return result.data;
}

function getCityLabel(city: CityOption) {
  return (
    city.Present ||
    [city.SettlementTypeDescription, city.Description, city.AreaDescription]
      .filter(Boolean)
      .join(", ")
  );
}

export function NovaPoshtaFields({
  deliveryPointType,
  invalid,
}: NovaPoshtaFieldsProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseOption | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    const query = cityQuery.trim();
    if (selectedCity || query.length < 2) {
      setCities([]);
      setIsLoadingCities(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsLoadingCities(true);
      setLookupError("");
      void lookupNovaPoshta<CityOption>(
        { action: "cities", query },
        controller.signal,
      )
        .then(setCities)
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setCities([]);
          setLookupError(
            error instanceof Error ? error.message : "Помилка пошуку міста.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingCities(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cityQuery, selectedCity]);

  useEffect(() => {
    setSelectedWarehouse(null);
    setWarehouseQuery("");
  }, [deliveryPointType]);

  useEffect(() => {
    if (!selectedCity || selectedWarehouse) {
      setWarehouses([]);
      setIsLoadingWarehouses(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsLoadingWarehouses(true);
      setLookupError("");
      void lookupNovaPoshta<WarehouseOption>(
        {
          action: "warehouses",
          cityRef: selectedCity.Ref,
          deliveryPointType,
          query: warehouseQuery.trim(),
        },
        controller.signal,
      )
        .then((results) => {
          const expectedCategory =
            deliveryPointType === "postomat" ? "Postomat" : "Branch";
          setWarehouses(
            results.filter(
              (warehouse) =>
                !warehouse.CategoryOfWarehouse ||
                warehouse.CategoryOfWarehouse === expectedCategory,
            ),
          );
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setWarehouses([]);
          setLookupError(
            error instanceof Error
              ? error.message
              : "Помилка пошуку відділення.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingWarehouses(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [deliveryPointType, selectedCity, selectedWarehouse, warehouseQuery]);

  function changeCityQuery(value: string) {
    setCityQuery(value);
    setSelectedCity(null);
    setSelectedWarehouse(null);
    setWarehouseQuery("");
  }

  function selectCity(city: CityOption) {
    setSelectedCity(city);
    setCityQuery(getCityLabel(city));
    setSelectedWarehouse(null);
    setWarehouseQuery("");
    setCities([]);
  }

  function selectWarehouse(warehouse: WarehouseOption) {
    setSelectedWarehouse(warehouse);
    setWarehouseQuery(warehouse.Description);
    setWarehouses([]);
  }

  const address =
    selectedCity && selectedWarehouse
      ? `${getCityLabel(selectedCity)}, ${selectedWarehouse.Description}`
      : "";

  return (
    <div className="checkout-nova-poshta-fields">
      <label
        className={`checkout-field${invalid ? " checkout-field-error" : ""}`}
      >
        <span>Місто</span>
        <input
          autoComplete="address-level2"
          name="citySearch"
          onChange={(event) => changeCityQuery(event.target.value)}
          placeholder="Почніть вводити назву міста"
          role="combobox"
          aria-invalid={invalid}
          aria-autocomplete="list"
          aria-expanded={cities.length > 0}
          value={cityQuery}
        />
      </label>
      {cities.length > 0 && (
        <ul className="checkout-lookup-options" role="listbox">
          {cities.map((city) => (
            <li key={city.Ref}>
              <button
                onClick={() => selectCity(city)}
                role="option"
                type="button"
                aria-selected={false}
              >
                {getCityLabel(city)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isLoadingCities && (
        <p className="checkout-lookup-status" role="status">
          Шукаємо місто…
        </p>
      )}

      {selectedCity && (
        <label
          className={`checkout-field${invalid && !selectedWarehouse ? " checkout-field-error" : ""}`}
        >
          <span>
            {deliveryPointType === "postomat" ? "Поштомат" : "Відділення"}
          </span>
          <input
            autoComplete="off"
            name="warehouseSearch"
            onChange={(event) => {
              setWarehouseQuery(event.target.value);
              setSelectedWarehouse(null);
            }}
            placeholder={
              deliveryPointType === "postomat"
                ? "Введіть номер або адресу поштомата"
                : "Введіть номер або адресу відділення"
            }
            role="combobox"
            aria-invalid={invalid && !selectedWarehouse}
            aria-autocomplete="list"
            aria-expanded={warehouses.length > 0}
            value={warehouseQuery}
          />
        </label>
      )}
      {warehouses.length > 0 && (
        <ul className="checkout-lookup-options" role="listbox">
          {warehouses.map((warehouse) => (
            <li key={warehouse.Ref}>
              <button
                onClick={() => selectWarehouse(warehouse)}
                role="option"
                type="button"
                aria-selected={false}
              >
                {warehouse.Description}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedCity && isLoadingWarehouses && (
        <p className="checkout-lookup-status" role="status">
          Шукаємо відділення…
        </p>
      )}
      {lookupError && (
        <p className="checkout-lookup-error" role="alert">
          {lookupError}
        </p>
      )}

      <input name="adress" type="hidden" value={address} />
      <input name="cityRef" type="hidden" value={selectedCity?.Ref ?? ""} />
      <input
        name="cityName"
        type="hidden"
        value={selectedCity ? getCityLabel(selectedCity) : ""}
      />
      <input
        name="warehouseRef"
        type="hidden"
        value={selectedWarehouse?.Ref ?? ""}
      />
      <input
        name="warehouseName"
        type="hidden"
        value={selectedWarehouse?.Description ?? ""}
      />
    </div>
  );
}
