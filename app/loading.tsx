import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-sumi/15 bg-surface-card text-shinobi-gold shadow-tactile-card">
        <span className="font-mono text-2xl font-black">忍</span>
      </div>
      <div className="mt-5 flex items-center gap-2 font-mono text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-shinobi-gold" />
        <span>Summoning Shinobi scrolls…</span>
      </div>
    </div>
  );
}
