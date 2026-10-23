import { Suspense } from "react";

import { SearchResultsPage } from "@/components/SearchPage/SearchResultsPage";
import { Header } from "@/components/MainPage/Header/Header";
import "@/components/CatalogPage/style.css";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

async function SearchPageContent({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");

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
      <>
        {/* <SearchPageContent searchParams={props.searchParams} /> */}
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-300">
              503
            </p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Service temporarily unavailable
            </h1>
            <p className="mt-4 text-base text-slate-300 md:text-lg">
              The website is currently unavailable. Please try again later.
            </p>
          </div>
        </main>
      </>
    </Suspense>
  );
}
