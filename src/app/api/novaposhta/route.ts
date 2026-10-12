import { NextResponse } from "next/server";

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";
const WAREHOUSE_TYPE_REFS: Record<"branch" | "postomat", string> = {
  branch: "841339c7-591a-42e2-8233-7a0a00f0ed6f",
  postomat: "f9316480-5f2d-425d-bc2c-ac7cd29decf0",
};

type NovaPoshtaRequest = {
  apiKey: string;
  modelName: "Address" | "AddressGeneral";
  calledMethod: "getCities" | "getWarehouses";
  methodProperties: Record<string, string>;
};

type LookupRequest =
  | { action: "cities"; query: string }
  | {
      action: "warehouses";
      cityRef: string;
      deliveryPointType: "branch" | "postomat";
      query?: string;
    };

function isLookupRequest(value: unknown): value is LookupRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Record<string, unknown>;
  if (request.action === "cities") {
    return typeof request.query === "string" && request.query.trim().length >= 2;
  }

  return (
    request.action === "warehouses" &&
    typeof request.cityRef === "string" &&
    request.cityRef.length > 0 &&
    (request.deliveryPointType === "branch" ||
      request.deliveryPointType === "postomat") &&
    (request.query === undefined || typeof request.query === "string")
  );
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  if (!isLookupRequest(input)) {
    return NextResponse.json(
      { error: "Invalid Nova Poshta lookup parameters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) {
    console.error("NOVA_POSHTA_API_KEY is not configured.");
    return NextResponse.json(
      { error: "Nova Poshta lookup is not configured." },
      { status: 503 },
    );
  }

  const calledMethod = input.action === "cities" ? "getCities" : "getWarehouses";
  const methodProperties: Record<string, string> = {
    FindByString:
      input.action === "cities" ? input.query.trim() : input.query?.trim() ?? "",
    Limit: input.action === "cities" ? "20" : "100",
  };
  if (input.action === "warehouses") {
    methodProperties.CityRef = input.cityRef;
    methodProperties.TypeOfWarehouseRef =
      WAREHOUSE_TYPE_REFS[input.deliveryPointType];
  }

  const payload: NovaPoshtaRequest = {
    apiKey,
    modelName: input.action === "cities" ? "Address" : "AddressGeneral",
    calledMethod,
    methodProperties,
  };

  try {
    const response = await fetch(NOVA_POSHTA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result: unknown = await response.json();
    if (!response.ok) {
      console.error("Nova Poshta API returned HTTP", response.status);
      return NextResponse.json(
        { error: "Nova Poshta API request failed." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Nova Poshta API request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach Nova Poshta API." },
      { status: 502 },
    );
  }
}
