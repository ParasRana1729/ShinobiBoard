export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifyLeetCode } from "@/components/VerifyLeetCode";
import { CreateGroupForm, JoinGroupForm } from "@/components/GroupForms";
import { DuelButtons } from "@/components/GroupSettings";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("auth_user_id", data.user.id).single(),
    supabase.from("memberships").select("group_id, role, joined_at, groups(id, name, type, goal, member_count)").eq("user_id", data.user.id),
  ]);

  async function signOut() {
    "use server";
    const s = createClient();
    await s.auth.signOut();
    redirect("/");
  }

  return (
    <main className="py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Dashboard 🍃 {profile?.display_name ?? ""}</h1>
        <form action={signOut}>
          <button className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm">Sign out</button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <VerifyLeetCode current={profile?.lc_username ?? null} />
        <div className="rounded-xl border border-slate-700 bg-card p-5">
          <h2 className="font-bold">Your stats</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p>Base rank: <b>{profile?.base_rank ?? "Academy"}</b> ({profile?.xp ?? 0} XP)</p>
            <p>Streak: <b>🔥 {profile?.streak ?? 0}</b></p>
            <p>Weekly: <b>{profile?.weekly_count ?? 0}</b> counted</p>
            <p>Sync: <b>{profile?.sync_status ?? "live"}</b>{profile?.frozen_reason ? ` · ${profile.frozen_reason}` : ""}</p>
          </div>
          {!profile?.lc_username && <p className="mt-2 text-xs text-amber-200">Link LeetCode above to start syncing — 60% verified-same-day is our launch gate.</p>}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold">Your groups ({memberships?.length ?? 0})</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(memberships ?? []).map((m: { group_id: string; role: string; groups: { id: string; name: string; type: string; goal: number; member_count: number } | { id: string; name: string; type: string; goal: number; member_count: number }[] }) => {
            const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
            if (!g) return null;
            return (
              <Link key={m.group_id} href={`/groups/${g.id}`} className="rounded-xl border border-slate-700 bg-card p-4 hover:border-amber-400">
                <p className="font-bold">{g.name}</p>
                <p className="text-xs text-slate-400">{g.type} · goal {g.goal}/wk · {g.member_count} members · {m.role}</p>
              </Link>
            );
          })}
          {(memberships ?? []).length === 0 && <p className="text-sm text-slate-400">No groups yet — create or join one below.</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <CreateGroupForm />
        <JoinGroupForm />
        <DuelButtons />
      </div>
    </main>
  );
}
