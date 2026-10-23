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
  return (
    <>
      <ProductContent params={params} />;
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
  );
}
