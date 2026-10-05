import { useEffect, useMemo, useRef } from "react";
import { MessageCircle, HelpCircle, BarChart3, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClassInteractionMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: "text" | "system" | "quiz" | "poll";
  metadata?: Record<string, unknown> | null;
  offsetSeconds: number;
}

interface ClassInteractionsProps {
  messages: ClassInteractionMessage[];
  currentTimeSeconds: number;
  onJumpToOffset?: (seconds: number) => void;
  query?: string;
  className?: string;
}

const formatOffset = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
};

const typeMeta = (type: ClassInteractionMessage["type"]) => {
  switch (type) {
    case "quiz":
      return {
        label: "Quiz",
        icon: HelpCircle,
        tone: "bg-violet-50 text-violet-700 border-violet-100",
      };
    case "poll":
      return {
        label: "Poll",
        icon: BarChart3,
        tone: "bg-sky-50 text-sky-700 border-sky-100",
      };
    case "system":
      return {
        label: "System",
        icon: Megaphone,
        tone: "bg-slate-50 text-slate-600 border-slate-100",
      };
    default:
      return {
        label: "Chat",
        icon: MessageCircle,
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };
  }
};

const ClassInteractions = ({
  messages,
  currentTimeSeconds,
  onJumpToOffset,
  query = "",
  className,
}: ClassInteractionsProps) => {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.message.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q),
    );
  }, [messages, q]);

  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < filtered.length; i += 1) {
      if (filtered[i].offsetSeconds <= currentTimeSeconds + 0.5) idx = i;
      else break;
    }
    return idx;
  }, [filtered, currentTimeSeconds]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center",
          className,
        )}
      >
        <MessageCircle className="mb-2 h-6 w-6 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">
          No class chat was saved
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Questions and messages from the live class will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-[16rem] flex-col gap-2", className)}>
      <p className="text-[11px] text-slate-500">
        {filtered.length} interaction{filtered.length === 1 ? "" : "s"} from the
        live class — tap a row to jump in the video.
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.map((msg, index) => {
          const meta = typeMeta(msg.type);
          const Icon = meta.icon;
          const isActive = index === activeIndex;
          return (
            <button
              key={`${msg.timestamp}-${msg.userId}-${index}`}
              type="button"
              ref={isActive ? activeRef : undefined}
              onClick={() => onJumpToOffset?.(msg.offsetSeconds)}
              className={cn(
                "w-full rounded-2xl border px-3 py-2.5 text-left transition",
                isActive
                  ? "border-[color-mix(in_srgb,var(--primary)_40%,white)] bg-[color-mix(in_srgb,var(--primary)_8%,white)] shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    meta.tone,
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                  {formatOffset(msg.offsetSeconds)}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500">
                  {msg.userName}
                </span>
              </div>
              <p className="text-sm leading-snug text-slate-800">{msg.message}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClassInteractions;
