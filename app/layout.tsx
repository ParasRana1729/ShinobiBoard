import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Navbar, type NavUser } from "@/components/Navbar";
import { redirect } from "next/navigation";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`dark ${fontSans.variable} ${fontHeading.variable} ${fontMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-ink font-sans text-text-primary antialiased bg-grid selection:bg-shinobi-gold/30 selection:text-shinobi-gold">
        <Navbar user={navUser} onSignOut={handleSignOut} />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pb-16 pt-4">
          {children}
        </div>
      </body>
    </html>
  );
}
