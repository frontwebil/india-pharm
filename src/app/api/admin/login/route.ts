import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { login, password } = (await request.json()) as {
    login?: string;
    password?: string;
  };

  const expectedLogin = process.env.ADMIN_LOGIN?.trim();
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedLogin || !expectedPassword) {
    return NextResponse.json(
      { error: "Admin credentials are not configured" },
      { status: 500 },
    );
  }

  if (login !== expectedLogin || password !== expectedPassword) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "authenticated", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
