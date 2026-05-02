export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-10">
        <div className="h-3 w-32 skel mb-3" />
        <div className="h-12 md:h-14 w-72 skel" />
        <div className="h-4 w-48 mt-2 skel" />
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 skel" />
          ))}
        </aside>
        <main>
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="h-8 w-48 skel mb-4" />
            <div className="h-4 w-64 skel mb-8" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 skel mb-3" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
