"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinClubButton({ groupId, memberCount }: { groupId: string; memberCount: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error ?? "Join failed");
    else if (j.waitlisted) setMsg("Club full (150) — you're on the waitlist");
    else router.refresh();
  }

  return (
    <div className="mt-4">
      <button onClick={join} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black">
        Join public club ({memberCount}/150)
      </button>
      {msg && <p className="mt-2 text-sm text-slate-300">{msg}</p>}
    </div>
  );
}
