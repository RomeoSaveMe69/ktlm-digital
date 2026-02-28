export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 animate-pulse">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="h-6 w-40 rounded bg-slate-800" />
          <div className="h-8 w-20 rounded bg-slate-800" />
        </div>
      </header>
      <main className="px-4 pt-6">
        <section className="mb-8 flex flex-col items-center gap-3">
          <div className="h-7 w-48 rounded bg-slate-800" />
          <div className="h-4 w-64 rounded bg-slate-800" />
          <div className="mx-auto h-14 w-full max-w-xl rounded-2xl bg-slate-800" />
        </section>
        <section className="mb-8">
          <div className="mb-4 h-4 w-32 rounded bg-slate-800" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 py-4">
                <div className="h-12 w-12 rounded-lg bg-slate-700" />
                <div className="h-3 w-16 rounded bg-slate-700" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-4 h-4 w-36 rounded bg-slate-800" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-700" />
                <div className="h-3 w-1/3 rounded bg-slate-700" />
                <div className="flex justify-between">
                  <div className="h-5 w-24 rounded bg-slate-700" />
                  <div className="h-5 w-16 rounded bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
