import { SearchResultsPage } from "@/components/SearchPage/SearchResultsPage";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] ?? "" : q ?? "";

  return <SearchResultsPage query={query} />;
}
