import { Clock } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  getActivityConfig,
  getInitials,
} from "@/components/activities/activityConfig";

export interface ActivityEventItem {
  _id: string;
  action: string;
  details?: string;
  createdAt: string;
  updatedAt?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
  } | null;
}

interface ActivityEventCardProps {
  log: ActivityEventItem;
  onClick?: () => void;
  compact?: boolean;
  /** EHR-style timeline node */
  timeline?: boolean;
  /** Emphasized node (filled primary/accent) */
  featured?: boolean;
  className?: string;
}

const isFeaturedAction = (action: string): boolean => {
  const key = getActivityConfig(action).filterKey;
  return (
    key === "creation" ||
    key === "deletion" ||
    key === "finance" ||
    key === "moderation"
  );
};

const ActivityEventCard = ({
  log,
  onClick,
  compact = false,
  timeline = false,
  featured,
  className,
}: ActivityEventCardProps) => {
  const config = getActivityConfig(log.action);
  const Icon = config.icon;
  const timeLabel = format(new Date(log.createdAt), "h:mm a");
  const shortTime = format(new Date(log.createdAt), "H:mm");
  const emphasize = featured ?? isFeaturedAction(log.action);

  if (timeline) {
    const body = (
      <div
        className={cn(
          "group relative w-full max-w-[min(100%,20rem)] overflow-hidden rounded-[1.35rem] text-left shadow-sm transition duration-200",
          emphasize
            ? "bg-primary text-primary-foreground shadow-primary/25 ring-1 ring-primary/30"
            : "bg-[#EEF0F3] text-slate-800 ring-1 ring-black/5",
          onClick &&
            "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
          className,
        )}
      >
        <div className="flex items-start gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              emphasize ? "bg-white/20" : "bg-white shadow-sm",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                emphasize ? "text-white" : config.iconColor,
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "text-sm font-bold leading-snug wrap-break-word",
                  emphasize ? "text-white" : "text-slate-900",
                )}
              >
                {log.action}
              </h3>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-semibold tabular-nums",
                  emphasize ? "text-white/75" : "text-slate-400",
                )}
              >
                {shortTime}
              </span>
            </div>
            <p
              className={cn(
                "mt-0.5 text-[11px] font-semibold uppercase tracking-wide",
                emphasize ? "text-white/70" : "text-slate-500",
              )}
            >
              {config.label}
              {log.resourceType ? ` · ${log.resourceType}` : ""}
            </p>
            {!compact && log.details && (
              <p
                className={cn(
                  "mt-1.5 line-clamp-2 text-xs leading-relaxed",
                  emphasize ? "text-white/80" : "text-slate-600",
                )}
              >
                {log.details}
              </p>
            )}
            <div className="mt-2.5 flex min-w-0 items-center gap-2">
              <Avatar
                className={cn(
                  "h-6 w-6 shrink-0 border",
                  emphasize ? "border-white/30" : "border-white",
                )}
              >
                {log.user?.avatar ? (
                  <AvatarImage src={log.user.avatar} alt={log.user.name} />
                ) : null}
                <AvatarFallback
                  className={cn(
                    "text-[9px] font-bold",
                    emphasize
                      ? "bg-white/25 text-white"
                      : "bg-teal-800 text-white",
                  )}
                >
                  {getInitials(log.user?.name || "System")}
                </AvatarFallback>
              </Avatar>
              <p
                className={cn(
                  "min-w-0 truncate text-[11px] font-medium",
                  emphasize ? "text-white/85" : "text-slate-600",
                )}
              >
                {log.user?.name || "System"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );

    if (onClick) {
      return (
        <button type="button" onClick={onClick} className="block w-full text-left">
          {body}
        </button>
      );
    }
    return body;
  }

  const body = (
    <div
      className={cn(
        "relative flex w-full min-w-0 gap-3 overflow-hidden rounded-2xl border text-left shadow-sm transition",
        config.cardBg,
        config.cardBorder,
        compact ? "p-3" : "p-3.5 sm:p-4",
        onClick &&
          "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full",
          config.accent,
        )}
      />

      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-white/70",
          compact ? "h-9 w-9" : "h-10 w-10",
        )}
      >
        <Icon className={cn("h-4 w-4", config.iconColor)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "min-w-0 flex-1 font-bold leading-snug text-slate-900 wrap-break-word",
              compact ? "text-sm" : "text-[15px] sm:text-base",
            )}
          >
            {log.action}
          </h3>
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {config.label}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
            {timeLabel}
          </span>
          {log.resourceType && (
            <span className="capitalize text-slate-500">{log.resourceType}</span>
          )}
        </div>

        {!compact && log.details && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 wrap-break-word">
            {log.details}
          </p>
        )}

        <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-black/5 pt-2.5">
          <Avatar className="h-7 w-7 shrink-0 border border-white shadow-sm">
            {log.user?.avatar ? (
              <AvatarImage src={log.user.avatar} alt={log.user.name} />
            ) : null}
            <AvatarFallback className="bg-teal-800 text-[10px] font-bold text-white">
              {getInitials(log.user?.name || "System")}
            </AvatarFallback>
          </Avatar>
          <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
            {log.user?.name || "System"}
            {log.user?.role ? (
              <span className="font-normal text-slate-500">
                {" "}
                · {log.user.role.replace(/_/g, " ")}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full">
        {body}
      </button>
    );
  }

  return body;
};

export default ActivityEventCard;
