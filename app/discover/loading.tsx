export default function DiscoverLoading() {
  return (
    <main className="space-y-8 py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sumi/15 pb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-sumi/10 animate-pulse" />
          <div className="h-8 w-64 rounded-xl bg-sumi/10 animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-sumi/[0.08] animate-pulse" />
        </div>

        {/* Search input skeleton */}
        <div className="h-10 w-full md:w-72 rounded-xl bg-sumi/[0.08] animate-pulse" />
      </div>

      {/* Clubs Grid Skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-sumi/15 bg-surface-card p-6 shadow-tactile-card space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded-full bg-sumi/10 animate-pulse" />
              <div className="h-4 w-16 rounded bg-sumi/[0.08] animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-6 w-3/4 rounded-lg bg-sumi/10 animate-pulse" />
              <div className="h-3.5 w-1/2 rounded bg-sumi/[0.08] animate-pulse" />
            </div>

            {/* Capacity meter skeleton */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <div className="h-2.5 w-16 rounded bg-sumi/[0.08] animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-sumi/[0.08] animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-sumi/[0.08] overflow-hidden">
                <div className="h-full w-2/3 bg-sumi/10 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Action button skeleton */}
            <div className="pt-2">
              <div className="h-9 w-full rounded-xl bg-sumi/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
