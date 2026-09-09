import BoardSkeleton from "@/components/BoardSkeleton";

export default function GroupLoading() {
  return (
    <main className="space-y-6 py-6">
      {/* Top Navigation & Group Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          {/* Back button skeleton */}
          <div className="h-9 w-9 rounded-xl bg-white/[0.08] animate-pulse" />

          {/* Group Title & Badges Skeleton */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 rounded-md bg-white/[0.08] animate-pulse" />
              <div className="h-3 w-12 rounded bg-white/[0.05] animate-pulse" />
            </div>
            <div className="h-7 w-52 rounded-xl bg-white/[0.1] animate-pulse" />
          </div>
        </div>

        {/* Right side controls skeleton */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-9 w-24 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>
      </div>

      {/* Main Grid: Board (left 8 cols) + Feed (right 4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Board Section Skeleton (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Controls Bar Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-surface-base p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded-xl bg-white/[0.08] animate-pulse" />
              <div className="h-8 w-20 rounded-xl bg-white/[0.05] animate-pulse" />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-28 rounded-xl bg-white/[0.06] animate-pulse" />
              <div className="h-8 w-36 rounded-xl bg-white/[0.06] animate-pulse" />
            </div>
          </div>

          {/* Cards Shimmer Skeleton */}
          <BoardSkeleton count={3} />
        </div>

        {/* Feed Section Skeleton (4 cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-white/[0.08] bg-surface-card p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/[0.2] animate-pulse" />
                <div className="h-4 w-28 rounded bg-white/[0.1] animate-pulse" />
              </div>
              <div className="h-3 w-12 rounded bg-white/[0.05] animate-pulse" />
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-16 rounded bg-white/[0.08] animate-pulse" />
                    <div className="h-2.5 w-10 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                  <div className="h-3 w-4/5 rounded bg-white/[0.06] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
