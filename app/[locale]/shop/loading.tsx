export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="pt-12 md:pt-16 pb-10">
        <div className="h-3 w-24 skel mb-4" />
        <div className="h-12 md:h-16 w-72 skel mb-4" />
        <div className="h-5 w-96 max-w-full skel" />
      </div>

      <div className="border-y border-border py-4 mb-8 flex gap-3">
        <div className="h-10 flex-1 max-w-md skel" />
        <div className="h-10 w-32 skel ml-auto" />
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10 pb-20">
        <aside className="hidden lg:block space-y-6">
          <div className="h-3 w-20 skel" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 skel" />
            ))}
          </div>
          <div className="h-3 w-24 skel" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 skel" />
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="aspect-[4/5] skel" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 skel" />
                <div className="flex justify-between">
                  <div className="h-5 w-12 skel" />
                  <div className="h-3 w-16 skel" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
