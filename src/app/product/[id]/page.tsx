import { ProductPage } from "@/components/ProductPage/ProductPage";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ id: string }>;
};

function ProductContent({ params }: PageProps) {
  return (
    <Suspense fallback={<div />}>
      <ProductParams params={params} />
    </Suspense>
  );
}

async function ProductParams({ params }: PageProps) {
  const { id } = await params;
  return <ProductPage key={id} id={id} />;
}

export default function Page({ params }: PageProps) {
  return <ProductContent params={params} />;
}
