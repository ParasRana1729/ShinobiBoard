import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Navbar, type NavUser } from "@/components/Navbar";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ShinobiBoard — Competitive LeetCode Accountability",
  description:
    "LeetCode progress dashboard with friend squads, Trello-style people-cards, streaks, ninja ranks, and weekly Hokage titles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();

  let navUser: NavUser | null = null;
  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, base_rank, streak, xp")
      .eq("auth_user_id", authData.user.id)
      .single();

    navUser = {
      id: authData.user.id,
      display_name: profile?.display_name ?? authData.user.user_metadata?.full_name ?? "Shinobi",
      avatar_url: profile?.avatar_url ?? authData.user.user_metadata?.avatar_url ?? null,
      base_rank: profile?.base_rank ?? "Academy",
      streak: profile?.streak ?? 0,
      xp: profile?.xp ?? 0,
    };
  }

  async function handleSignOut() {
    "use server";
    const s = createClient();
    await s.auth.signOut();
    redirect("/");
  }

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-ink text-slate-100 antialiased bg-grid">
        <Navbar user={navUser} onSignOut={handleSignOut} />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pb-16 pt-4">
          {children}
        </div>
      </body>
    </html>
  );
}
