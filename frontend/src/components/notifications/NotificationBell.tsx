import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationList } from "./NotificationList";
import { useNotification } from "@/hooks/useNotification";
import { unlockNotificationAudio } from "@/lib/notification-sound";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount?: number;
  className?: string;
}

export const NotificationBell = ({
  unreadCount: unreadCountProp,
  className,
}: NotificationBellProps) => {
  const { unreadCount: contextCount } = useNotification();
  const unreadCount = unreadCountProp ?? contextCount;
  const prevUnread = useRef(unreadCount);
  const [bouncing, setBouncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelPhase, setPanelPhase] = useState<"enter" | "shown" | "exit">(
    "enter",
  );
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setBouncing(true);
      const t = window.setTimeout(() => setBouncing(false), 900);
      prevUnread.current = unreadCount;
      return () => window.clearTimeout(t);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  const closePanel = useCallback(() => {
    setPanelPhase("exit");
    window.setTimeout(() => {
      setOpen(false);
      setPanelPhase("enter");
    }, 180);
  }, []);

  const openPanel = useCallback(() => {
    unlockNotificationAudio();
    setPanelPhase("enter");
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelPhase("shown"));
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closePanel]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
          bouncing && "notif-bell-bounce",
          className,
        )}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open) closePanel();
          else openPanel();
        }}
      >
        <Bell
          className={cn(
            "h-5 w-5 transition-transform",
            bouncing && "text-primary",
            unreadCount > 0 && "text-foreground",
          )}
        />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm shadow-primary/40 ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-ping rounded-full bg-primary/70" />
        ) : null}
      </Button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[180] flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Dismiss notifications"
                className={cn(
                  "absolute inset-0 bg-[#1C1C21]/35 backdrop-blur-[1.5px] transition-opacity duration-200",
                  panelPhase === "shown" ? "opacity-100" : "opacity-0",
                )}
                onClick={closePanel}
              />

              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "notif-panel-shell relative z-10 flex h-[min(78vh,560px)] w-full max-w-[26rem] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background shadow-[0_24px_80px_rgba(28,28,33,0.22)]",
                  panelPhase === "enter" &&
                    "scale-[0.92] opacity-0",
                  panelPhase === "shown" && "notif-panel-pop",
                  panelPhase === "exit" &&
                    "scale-[0.96] opacity-0 transition-all duration-150 ease-in",
                )}
              >
                <NotificationList
                  titleId={titleId}
                  onItemNavigate={closePanel}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
