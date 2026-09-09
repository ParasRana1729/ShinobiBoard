export default function BoardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="board-scroll flex gap-4 overflow-x-auto pb-4 pt-1 max-md:flex-col">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative flex w-72 shrink-0 flex-col justify-between rounded-2xl border border-white/[0.06] bg-surface/70 p-4 shadow-xl backdrop-blur-md max-md:w-full"
        >
          <div>
            {/* Header: Avatar, Name, Rank */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {/* Avatar Skeleton */}
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.08] animate-pulse" />

                {/* Name & Handle Skeleton */}
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3 w-24 rounded bg-white/[0.1] animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-white/[0.05] animate-pulse" />
                </div>
              </div>

              {/* Rank Position Skeleton */}
              <div className="flex flex-col items-end space-y-1">
                <div className="h-4 w-6 rounded bg-white/[0.1] animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-white/[0.06] animate-pulse" />
              </div>
            </div>

            {/* Badges row Skeleton */}
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-4 w-16 rounded-md bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-12 rounded-md bg-white/[0.04] animate-pulse" />
            </div>

            {/* Metrics: Solves & Streak Skeleton */}
            <div className="mt-3.5 space-y-2 rounded-xl border border-white/[0.04] bg-ink/60 p-2.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-white/[0.08] animate-pulse" />
                <div className="h-3 w-12 rounded bg-white/[0.08] animate-pulse" />
              </div>

              {/* Progress bar skeleton */}
              <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full w-2/5 bg-white/[0.12] rounded-full animate-pulse" />
              </div>

              {/* Solves info skeleton */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <div className="h-2.5 w-24 rounded bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-10 rounded bg-white/[0.08] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Card Actions Footer Skeleton */}
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-6 w-6 rounded-lg bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
