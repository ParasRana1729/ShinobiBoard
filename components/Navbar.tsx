"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export interface NavUser {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  base_rank?: string | null;
  streak?: number;
  xp?: number;
}

export function Navbar({
  user,
  onSignOut,
}: {
  user: NavUser | null;
  onSignOut?: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sumi/15 bg-ink">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-shinobi-gold/60 bg-shinobi-gold font-heading text-base font-bold text-white shadow-sm">
              忍
            </span>
            <span className="font-heading text-lg text-text-primary">ShinobiBoard</span>
          </Link>

          {user && (
            <nav className="hidden items-center gap-5 md:flex">
              <Link
                href="/dashboard"
                className={`text-sm ${
                  pathname === "/dashboard"
                    ? "text-text-primary underline decoration-shinobi-gold underline-offset-4"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/discover"
                className={`text-sm ${
                  pathname === "/discover"
                    ? "text-text-primary underline decoration-shinobi-gold underline-offset-4"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Clubs
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span
                title={`${user.streak ?? 0} consecutive UTC days`}
                className="font-mono text-xs text-text-secondary"
              >
                {user.streak ?? 0}d
              </span>
              <span className="hidden font-mono text-xs text-text-muted sm:inline">
                {user.base_rank ?? "Academy"} · {user.xp ?? 0} XP
              </span>
              <div className="flex items-center gap-2 border border-sumi/15 bg-surface-card py-0.5 pl-0.5 pr-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`}
                  alt=""
                  className="h-6 w-6 bg-surface-elevated object-cover"
                />
                <span className="max-w-[100px] truncate text-xs text-text-primary">
                  {user.display_name ?? "Shinobi"}
                </span>
                {onSignOut && (
                  <form action={onSignOut}>
                    <button
                      type="submit"
                      title="Sign out"
                      className="ml-1 p-1 text-text-muted hover:text-shinobi-gold"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/discover" className="hidden text-sm text-text-secondary hover:text-text-primary sm:inline">
                Clubs
              </Link>
              <Link href="/login" className="btn-tactile-primary py-1.5">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
