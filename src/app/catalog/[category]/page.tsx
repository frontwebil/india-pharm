import { CategoryPage } from "@/components/CatalogPage/CategoryPage/CategoryPage";

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { category } = await params;

  return <div><CategoryPage category={category}/></div>;
}
