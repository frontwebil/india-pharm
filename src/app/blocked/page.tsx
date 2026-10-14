export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-300">
          Access unavailable
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          This website is not available in your region.
        </h1>
        <p className="mt-4 text-base text-slate-300 md:text-lg">
          We are currently operating only for users from Ukraine.
        </p>
      </div>
    </main>
  );
}
