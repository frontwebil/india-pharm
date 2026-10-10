import { ProductPage } from "@/components/ProductPage/ProductPage";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ id: string }>;
};

function ProductContent({ params }: PageProps) {
  return (
    <Suspense fallback={""}>
      {" "}
      <ProductParams params={params} />{" "}
    </Suspense>
  );
}

async function ProductParams({ params }: PageProps) {
  const { id } = await params;
  const product1 = await prisma.product.findFirst({
    where: {
      id: Number(id),
    },
  });

  console.log(product1);

  return <ProductPage id={id} />;
}

export default function Page({ params }: PageProps) {
  return <ProductContent params={params} />;
}
