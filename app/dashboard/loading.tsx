export default function DashboardLoading() {
  return (
    <main className="space-y-8 py-6">
      {/* Top Banner Skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 rounded-md bg-white/[0.08] animate-pulse" />
            <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse" />
          </div>
          <div className="h-8 w-64 rounded-xl bg-white/[0.1] animate-pulse" />
          <div className="h-3.5 w-96 rounded bg-white/[0.05] animate-pulse max-w-full" />
        </div>

        <div className="h-9 w-44 rounded-xl bg-white/[0.08] animate-pulse" />
      </div>

      {/* Hero Dossier + Objectives Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dossier Card Skeleton (2 cols) */}
        <div className="rounded-3xl border border-white/[0.08] bg-surface-card p-6 shadow-xl lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white/[0.08] animate-pulse" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 rounded-full bg-white/[0.08] animate-pulse" />
                  <div className="h-5 w-14 rounded-full bg-white/[0.06] animate-pulse" />
                </div>
                <div className="h-6 w-36 rounded-lg bg-white/[0.1] animate-pulse" />
                <div className="h-3 w-48 rounded bg-white/[0.05] animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse ml-auto" />
              <div className="h-8 w-32 rounded bg-white/[0.1] animate-pulse ml-auto" />
            </div>
          </div>

          {/* XP Bar Skeleton */}
          <div className="space-y-2 rounded-2xl border border-white/[0.04] bg-surface-elevated/60 p-4">
            <div className="flex justify-between">
              <div className="h-3.5 w-36 rounded bg-white/[0.08] animate-pulse" />
              <div className="h-3.5 w-12 rounded bg-white/[0.08] animate-pulse" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full w-1/3 bg-white/[0.15] rounded-full animate-pulse" />
            </div>
            <div className="flex justify-between text-xs">
              <div className="h-2.5 w-16 rounded bg-white/[0.05] animate-pulse" />
              <div className="h-2.5 w-24 rounded bg-white/[0.05] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Objectives Quest Card Skeleton (1 col) */}
        <div className="rounded-3xl border border-white/[0.08] bg-surface p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <div className="h-4 w-4 rounded-full bg-white/[0.08] animate-pulse" />
            <div className="h-4 w-32 rounded bg-white/[0.1] animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.04]" />
            <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.04]" />
            <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.04]" />
          </div>
        </div>
      </div>

      {/* Squads Matrix Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-white/[0.1] animate-pulse" />
          <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.08] bg-surface-card p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded-full bg-white/[0.08] animate-pulse" />
                <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-5 w-3/4 rounded bg-white/[0.1] animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-white/[0.05] animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full w-1/2 bg-white/[0.1] rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-full rounded-xl bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
