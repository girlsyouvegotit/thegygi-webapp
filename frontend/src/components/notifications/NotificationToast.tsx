import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { notification } from "@/types";
import { getNotificationVisual } from "./notificationVisuals";

export type ToastNotification = notification & { toastId: string };

interface NotificationToastStackProps {
  toasts: ToastNotification[];
  onDismiss: (toastId: string) => void;
  onOpen: (n: ToastNotification) => void;
}

export function NotificationToastStack({
  toasts,
  onDismiss,
  onOpen,
}: NotificationToastStackProps) {
  if (typeof document === "undefined" || toasts.length === 0) return null;

  const active = toasts[0];

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-live="polite"
    >
      <div
        className="notif-toast-backdrop pointer-events-auto absolute inset-0 bg-[#1C1C21]/30 backdrop-blur-[1px]"
        onClick={() => onDismiss(active.toastId)}
        aria-hidden
      />

      <div className="pointer-events-none relative z-10 w-full max-w-sm">
        <NotificationToastCard
          toast={active}
          onDismiss={() => onDismiss(active.toastId)}
          onOpen={() => onOpen(active)}
        />
      </div>
    </div>,
    document.body,
  );
}

function NotificationToastCard({
  toast,
  onDismiss,
  onOpen,
}: {
  toast: ToastNotification;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "shown" | "exit">("enter");
  const visual = getNotificationVisual(toast.type);
  const Icon = visual.icon;

  useEffect(() => {
    const showTimer = window.setTimeout(() => setPhase("shown"), 16);
    const exitTimer = window.setTimeout(() => setPhase("exit"), 4200);
    const removeTimer = window.setTimeout(onDismiss, 4500);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-[1.35rem] border border-border bg-background text-foreground shadow-[0_20px_60px_rgba(28,28,33,0.2)]",
        phase === "enter" && "scale-[0.92] opacity-0",
        phase === "shown" && "notif-panel-pop",
        phase === "exit" &&
          "scale-[0.96] opacity-0 transition-all duration-150 ease-in",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3.5 pr-11 text-left",
          visual.surface,
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            visual.iconChip,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="mb-0.5 flex items-center gap-2">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
              {visual.label}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              just now
            </span>
          </span>
          <span className="block text-sm font-bold leading-snug text-slate-900">
            {toast.title}
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
            {toast.message}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPhase("exit");
          window.setTimeout(onDismiss, 160);
        }}
        className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
