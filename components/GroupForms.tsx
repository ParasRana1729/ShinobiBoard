"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"squad" | "club">("squad");
  const [goal, setGoal] = useState(7);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, goal }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j.error ?? "Create failed");
      return;
    }
    router.push(`/groups/${j.group.id}`);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-card p-5">
      <h2 className="font-bold">Create group</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. blind-75-fall-26"
          className="rounded-lg border border-slate-600 bg-ink px-3 py-2 text-sm sm:col-span-2" required maxLength={80} />
        <select value={type} onChange={(e) => setType(e.target.value as "squad" | "club")}
          className="rounded-lg border border-slate-600 bg-ink px-3 py-2 text-sm">
          <option value="squad">Private Squad (code, 3–15)</option>
          <option value="club">Public Club (discover, ≤150)</option>
        </select>
      </div>
      <label className="mt-2 block text-sm text-slate-300">
        Weekly goal (1–50, default 7)
        <input type="number" min={1} max={50} value={goal} onChange={(e) => setGoal(Number(e.target.value))}
          className="ml-2 w-20 rounded-lg border border-slate-600 bg-ink px-2 py-1 text-sm" />
      </label>
      <button className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Create</button>
      {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
    </form>
  );
}

export function JoinGroupForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j.error ?? "Join failed");
      return;
    }
    router.push(`/groups/${j.group.id}`);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-card p-5">
      <h2 className="font-bold">Join with invite code</h2>
      <div className="mt-3 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="8-char code"
          className="flex-1 rounded-lg border border-slate-600 bg-ink px-3 py-2 font-mono text-sm" required />
        <button className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold">Join</button>
      </div>
      {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
    </form>
  );
}
