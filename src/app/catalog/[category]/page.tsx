import { CategoryPage } from "@/components/CatalogPage/CategoryPage/CategoryPage";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ category: string }>;
};

function CategoryContent({ params }: PageProps) {
  return (
    <Suspense fallback={""}>
      {" "}
      <CategoryParams params={params} />{" "}
    </Suspense>
  );
}

async function CategoryParams({ params }: PageProps) {
  const { category } = await params;

  return <CategoryPage category={category} />;
}

export default function Page({ params }: PageProps) {
  return <CategoryContent params={params} />;
}
