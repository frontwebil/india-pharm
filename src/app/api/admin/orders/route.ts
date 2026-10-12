import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const TELEGRAM_NOTIFICATION_API_URL =
  process.env.NOTIFICATION_API_URL ?? "http://localhost:8000/api/notificationTelegram";

const serializeOrder = (order: {
  id: bigint | number;
  status: string | null;
  name: string | null;
  phone: string | null;
  adress: string | null;
  delivery: string | null;
  paymentType: string | null;
  prefferContactMethod: string | null;
  userChatId: string | null;
  userTelegram: string | null;
  products: unknown;
  ttn?: string | null;
  createdAt?: Date | string | null;
}) => ({
  id: Number(order.id),
  status: order.status ?? "New",
  name: order.name ?? "",
  phone: order.phone ?? "",
  adress: order.adress ?? "",
  delivery: order.delivery ?? "nova-poshta-branch",
  paymentType: order.paymentType ?? "cash-on-delivery",
  prefferContactMethod: order.prefferContactMethod ?? "telegram",
  userChatId: order.userChatId ?? "",
  userTelegram: order.userTelegram ?? "",
  products: Array.isArray(order.products) ? order.products : [],
  ttn: order.ttn ?? null,
  createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
});

const requireAdminAccess = async () => {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
};

const sendTelegramNotification = async (order: unknown) => {
  try {
    const response = await fetch(TELEGRAM_NOTIFICATION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "Telegram notification request failed:",
        response.status,
        errorText,
      );
    }
  } catch (error) {
    console.error("Telegram notification delivery failed:", error);
  }
};

export async function GET(request: Request) {
  if (!(await requireAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: {
        id: BigInt(orderId),
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  }

  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    orders: orders.map((order) => serializeOrder(order)),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    name?: string;
    phone?: string;
    adress?: string;
    delivery?: string;
    status?: string;
    paymentType?: string;
    prefferContactMethod?: string;
    userChatId?: string;
    userTelegram?: string;
    products?: Prisma.InputJsonValue;
    ttn?: string | null;
  };

  const record = await prisma.order.create({
    data: {
      id: BigInt(Date.now()),
      status: payload.status ?? "New",
      name: payload.name ?? "",
      phone: payload.phone ?? "",
      adress: payload.adress ?? "",
      delivery: payload.delivery ?? "nova-poshta-branch",
      paymentType: payload.paymentType ?? "cash-on-delivery",
      prefferContactMethod: payload.prefferContactMethod ?? "telegram",
      userChatId: payload.userChatId ?? "",
      userTelegram: payload.userTelegram ?? "",
      products: Array.isArray(payload.products)
        ? (payload.products as Prisma.InputJsonValue)
        : [],
      ttn: payload.ttn ?? null,
    },
  });

  return NextResponse.json({ order: serializeOrder(record) });
}

export async function PUT(request: Request) {
  if (!(await requireAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    id?: number | string;
    name?: string;
    phone?: string;
    adress?: string;
    delivery?: string;
    status?: string;
    paymentType?: string;
    prefferContactMethod?: string;
    userChatId?: string;
    userTelegram?: string;
    products?: Prisma.InputJsonValue;
    ttn?: string | null;
    sendTelegramNotification?: boolean;
  };

  if (!payload.id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  const orderId = BigInt(String(payload.id));
  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  const nextStatus = payload.status ?? currentOrder?.status ?? "New";
  const statusChanged =
    !!currentOrder && currentOrder.status !== nextStatus && payload.status !== undefined;

  const record = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: nextStatus,
      name: payload.name ?? "",
      phone: payload.phone ?? "",
      adress: payload.adress ?? "",
      delivery: payload.delivery ?? "nova-poshta-branch",
      paymentType: payload.paymentType ?? "cash-on-delivery",
      prefferContactMethod: payload.prefferContactMethod ?? "telegram",
      userChatId: payload.userChatId ?? "",
      userTelegram: payload.userTelegram ?? "",
      products: Array.isArray(payload.products)
        ? (payload.products as Prisma.InputJsonValue)
        : [],
      ttn: payload.ttn ?? null,
    },
  });

  if (payload.sendTelegramNotification && statusChanged) {
    await sendTelegramNotification(serializeOrder(record));
  }

  return NextResponse.json({ order: serializeOrder(record) });
}

export async function DELETE(request: Request) {
  if (!(await requireAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { id?: number | string };
  const orderId = payload.id ?? new URL(request.url).searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  await prisma.order.delete({
    where: {
      id: BigInt(String(orderId)),
    },
  });

  return NextResponse.json({ success: true });
}
