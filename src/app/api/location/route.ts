export async function GET(request: Request) {
  const headers = request.headers;

  const country =
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-country-code") ??
    "unknown";

  const ip =
    headers.get("x-forwarded-for") ??
    headers.get("x-real-ip") ??
    "unknown";

  const region =
    headers.get("cf-region") ??
    headers.get("x-vercel-ip-region") ??
    "unknown";

  return Response.json({
    country,
    region,
    ip,
    language: headers.get("accept-language") ?? "unknown",
    userAgent: headers.get("user-agent") ?? "unknown",
  });
}
