import { Suspense } from "react";

import { SearchResultsPage } from "@/components/SearchPage/SearchResultsPage";
import { Header } from "@/components/MainPage/Header/Header";
import "@/components/CatalogPage/style.css";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

async function SearchPageContent({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] ?? "" : q ?? "";

  return <SearchResultsPage query={query} />;
}

function SearchPageFallback() {
  return (
    <>
      <Header />
      <main className="catalog-page">
        <div className="catalog-page-container">
          <p className="search-results-state">
            Завантажуємо результати пошуку...
          </p>
        </div>
      </main>
    </>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent searchParams={props.searchParams} />
    </Suspense>
  );
}
