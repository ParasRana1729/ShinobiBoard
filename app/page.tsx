import Link from "next/link";

export default function Home() {
  return (
    <main className="py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-300/80">ShinobiBoard · LeetCode Board v1.1</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
        Solo grind dies after week 1. Your squad won&apos;t let it.
      </h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        LeetCode progress dashboard with friend groups and Trello-style people-cards.
        Protect your streak, climb from Academy to Kage, and hold the weekly Hokage title.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-black hover:bg-amber-300">
          Sign in with Google
        </Link>
        <Link href="/discover" className="rounded-lg border border-slate-600 px-5 py-2.5 font-semibold hover:border-slate-400">
          Discover public clubs
        </Link>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { t: "Private Squads", d: "Invite-code only, 3–15 members. Your inner circle." },
          { t: "Public Clubs", d: "Discover + instant join, up to 150. Topic prep at scale." },
          { t: "1:1 Duels", d: "Exactly 2 rivals. Daily W/L/D, head-to-head solve diff." },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="font-bold">{c.t}</h2>
            <p className="mt-1 text-sm text-slate-300">{c.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-slate-700 bg-card p-5 text-sm text-slate-300">
        <h2 className="font-bold text-slate-100">How it works</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Sign in with Google, link your public LeetCode username (anti-squat verified).</li>
          <li>Server polls LeetCode hourly — only synced solves count, no manual adds.</li>
          <li>Weekly goal defaults to 7 (Mon–Sun UTC). Streaks, XP and base ranks update automatically.</li>
          <li>Monday 00:05 UTC: weekly reset + Hokage / Itachi / Rock Lee titles granted.</li>
        </ol>
      </section>
    </main>
  );
}
