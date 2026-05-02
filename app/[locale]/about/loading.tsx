export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <div className="mb-16">
        <div className="h-3 w-32 skel mb-4" />
        <div className="h-16 md:h-20 w-full max-w-2xl skel mb-2" />
        <div className="h-16 md:h-20 w-full max-w-3xl skel mb-6" />
        <div className="h-5 w-full max-w-2xl skel mb-2" />
        <div className="h-5 w-3/4 max-w-xl skel" />
      </div>

      <div className="grid md:grid-cols-12 gap-8 mb-20">
        <div className="md:col-span-7 aspect-[16/10] rounded-3xl skel" />
        <div className="md:col-span-5 space-y-4">
          <div className="h-3 w-28 skel" />
          <div className="h-8 w-full skel" />
          <div className="h-8 w-3/4 skel" />
          <div className="h-4 w-full skel" />
          <div className="h-4 w-2/3 skel" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[5/3] rounded-2xl skel" />
            <div className="h-3 w-20 skel" />
            <div className="h-6 w-full skel" />
            <div className="h-4 w-3/4 skel" />
          </div>
        ))}
      </div>
    </div>
  );
}
