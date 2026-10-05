import { useEffect, useState } from "react";
import { PartyPopper, X } from "lucide-react";
import {
  dismissOccasion,
  getActiveOccasion,
  isOccasionDismissed,
  type Occasion,
} from "@/lib/occasions";
import { cn } from "@/lib/utils";

/**
 * Sticky celebratory toast for special occasions.
 * Stays visible until the user clicks cancel — dismissal is stored per occasion/year.
 */
export default function OccasionToast({ className }: { className?: string }) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const active = getActiveOccasion();
    if (!active || isOccasionDismissed(active)) {
      setOccasion(null);
      setVisible(false);
      return;
    }
    setOccasion(active);
    setVisible(true);
  }, []);

  if (!visible || !occasion) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border px-4 py-3.5 shadow-sm sm:px-5 sm:py-4",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${occasion.accentSoft} 0%, #ffffff 55%)`,
        borderColor: `${occasion.accent}33`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-30"
        style={{ background: occasion.accent }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm"
          style={{ background: `${occasion.accent}18`, color: occasion.accent }}
          aria-hidden
        >
          <span className="text-xl leading-none">{occasion.emoji}</span>
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-sm font-black tracking-tight sm:text-base"
              style={{ color: occasion.accent }}
            >
              {occasion.title}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <PartyPopper className="h-3 w-3" />
              Special day
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {occasion.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissOccasion(occasion);
            setVisible(false);
          }}
          className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800"
          aria-label="Dismiss celebration message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
