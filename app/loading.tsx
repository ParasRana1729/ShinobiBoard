import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-shinobi-gold/30 bg-surface-elevated text-shinobi-gold shadow-2xl shadow-shinobi-gold/10">
        <span className="font-mono text-2xl font-black animate-pulse">忍</span>
        <div className="absolute inset-0 rounded-2xl border border-shinobi-gold/40 animate-ping opacity-25" />
      </div>
      <div className="mt-5 flex items-center gap-2 font-mono text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-shinobi-gold" />
        <span>Summoning Shinobi scrolls…</span>
      </div>
    </div>
  );
}
