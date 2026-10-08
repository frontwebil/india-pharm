import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      isTop: true,
    },
  });

  return NextResponse.json({
    products,
  });
}
