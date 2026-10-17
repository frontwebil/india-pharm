const LOCAL_ORDER_API_URL = "http://localhost:8000/api/order";
const apiSecret = process.env.API_SECRET;

export async function POST(request: Request) {
  if (!apiSecret) {
    throw new Error("API_SECRET is not configured");
  }
  const orderApiUrl =
    process.env.ORDER_API_URL ??
    (process.env.NODE_ENV !== "production" ? LOCAL_ORDER_API_URL : "");

  if (!orderApiUrl) {
    return Response.json(
      {
        error: "Order API is not configured",
        message: "Set ORDER_API_URL to the backend order endpoint.",
      },
      { status: 503 },
    );
  }

  try {
    const backendResponse = await fetch(orderApiUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
        "x-api-secret": apiSecret,
      },
      body: await request.text(),
      cache: "no-store",
    });

    return new Response(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Order API proxy request failed:", error);

    return Response.json(
      { error: "Unable to reach the order backend" },
      { status: 502 },
    );
  }
}
