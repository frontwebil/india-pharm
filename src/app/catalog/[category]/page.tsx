import { CategoryPage } from "@/components/CatalogPage/CategoryPage/CategoryPage";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { category } = await params;

  return (
    <Suspense>
      <CategoryPage category={category} />
    </Suspense>
  );
}
