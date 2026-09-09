"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Shield, Swords, Compass, LayoutDashboard, LogOut, Sparkles } from "lucide-react";

export interface NavUser {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  base_rank?: string | null;
  streak?: number;
  xp?: number;
}

const RANK_BADGE: Record<string, { label: string; color: string }> = {
  Academy: { label: "Academy", color: "text-slate-400 border-slate-700 bg-slate-800/40" },
  Genin: { label: "Genin", color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40" },
  Chunin: { label: "Chunin", color: "text-amber-400 border-amber-500/30 bg-amber-950/40" },
  Jonin: { label: "Jonin", color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/40" },
  ANBU: { label: "ANBU", color: "text-purple-400 border-purple-500/30 bg-purple-950/40" },
  Kage: { label: "Kage", color: "text-yellow-300 border-yellow-500/40 bg-yellow-950/40 shadow-glow-gold" },
};

export function Navbar({
  user,
  onSignOut,
}: {
  user: NavUser | null;
  onSignOut?: () => Promise<void>;
}) {
  const pathname = usePathname();

  const rankInfo = user?.base_rank ? RANK_BADGE[user.base_rank] ?? RANK_BADGE.Academy : RANK_BADGE.Academy;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-400/20 to-amber-600/10 shadow-glow">
              <span className="font-mono text-lg font-black text-amber-400">忍</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  ShinobiBoard
                </span>
                <span className="rounded bg-white/[0.06] px-1 py-0.2 font-mono text-[9px] font-semibold text-slate-400">
                  v1.1
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                LeetCode Accountability
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  pathname === "/dashboard"
                    ? "bg-white/[0.08] text-amber-300 border border-amber-500/20"
                    : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/discover"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  pathname === "/discover"
                    ? "bg-white/[0.08] text-amber-300 border border-amber-500/20"
                    : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Clubs
              </Link>
            </nav>
          )}
        </div>

        {/* Right side Profile / Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Streak Badge */}
              <div
                title={`${user.streak ?? 0} consecutive UTC days`}
                className="flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-950/30 px-2.5 py-1 text-xs font-semibold text-orange-400 shadow-sm"
              >
                <Flame className="h-3.5 w-3.5 fill-orange-400 animate-pulse" />
                <span className="font-mono">{user.streak ?? 0}d</span>
              </div>

              {/* Base Rank Badge */}
              <div
                title={`Rank: ${rankInfo.label} (${user.xp ?? 0} XP)`}
                className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${rankInfo.color}`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{rankInfo.label}</span>
                <span className="font-mono text-[10px] opacity-75">{user.xp ?? 0} XP</span>
              </div>

              {/* User Avatar Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface p-1 pr-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`}
                  alt=""
                  className="h-7 w-7 rounded-lg bg-slate-800 object-cover"
                />
                <span className="max-w-[100px] truncate text-xs font-semibold text-slate-200">
                  {user.display_name ?? "Shinobi"}
                </span>

                {onSignOut && (
                  <form action={onSignOut}>
                    <button
                      type="submit"
                      title="Sign out"
                      className="ml-1 rounded p-1 text-slate-400 hover:bg-white/[0.08] hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/discover"
                className="hidden sm:inline-flex rounded-lg border border-white/[0.08] bg-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/[0.2] transition-colors"
              >
                Discover Clubs
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-xs font-bold text-black shadow-glow hover:brightness-110 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 fill-black" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
