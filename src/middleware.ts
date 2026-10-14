import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_PATH = "/error";

function getCountry(request: NextRequest): string {
  return (
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code") ??
    "unknown"
  ).toUpperCase();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === BLOCKED_PATH ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/")) {
    const isAuthenticated =
      request.cookies.get("admin_session")?.value === "authenticated";

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  const country = getCountry(request);
  const isLocalhost =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";

  if (!isLocalhost && country && country !== "UA") {
    return NextResponse.redirect(new URL(BLOCKED_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/catalog",
    "/catalog/:path*",
    "/admin",
    "/admin/:path*",
    "/blocked",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
