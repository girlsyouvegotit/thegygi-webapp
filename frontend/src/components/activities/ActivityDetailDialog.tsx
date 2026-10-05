import { useMemo, type ReactNode } from "react";
import {
  Calendar,
  Clock,
  Fingerprint,
  Hash,
  Layers,
  Mail,
  Target,
  UserRound,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getActivityConfig,
  getInitials,
} from "@/components/activities/activityConfig";
import type { ActivityEventItem } from "@/components/activities/ActivityEventCard";

interface ActivityDetailDialogProps {
  log: ActivityEventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

const prettyValue = (value: unknown): string => {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const DetailBlock = ({
  label,
  children,
  delayMs = 0,
}: {
  label: string;
  children: ReactNode;
  delayMs?: number;
}) => (
  <div
    className="activity-section-in space-y-2"
    style={{ animationDelay: `${delayMs}ms` }}
  >
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {label}
    </p>
    {children}
  </div>
);

const ActivityDetailDialog = ({
  log,
  open,
  onOpenChange,
}: ActivityDetailDialogProps) => {
  const config = log ? getActivityConfig(log.action) : null;
  const Icon = config?.icon;

  const detailEntries = useMemo(() => {
    if (!log?.details) return null;

    try {
      const parsed = JSON.parse(log.details);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return Object.entries(parsed as Record<string, unknown>);
      }
    } catch {
      /* plain string */
    }
    return null;
  }, [log?.details]);

  const metadataEntries = useMemo(() => {
    if (!log?.metadata || typeof log.metadata !== "object") return [];
    return Object.entries(log.metadata);
  }, [log?.metadata]);

  const created = log ? new Date(log.createdAt) : null;
  const relative =
    created != null
      ? formatDistanceToNow(created, { addSuffix: true })
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          // Keep DialogContent stably centered — bounce lives on the inner shell.
          "z-[80] w-[calc(100vw-1.25rem)] max-w-lg border-0 bg-transparent p-0 shadow-none sm:max-w-xl",
          "max-h-[min(92dvh,calc(100svh-1rem))] overflow-visible",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
        )}
      >
        {log && config && Icon && created && (
          <div className="activity-modal-inner-bounce flex max-h-[min(90dvh,42rem)] flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_32px_80px_-28px_rgba(15,23,42,0.5)] ring-1 ring-black/5">
            <DialogHeader
              className={cn(
                "relative shrink-0 space-y-0 overflow-hidden border-b px-5 pb-5 pt-6 text-left sm:px-7 sm:pb-6 sm:pt-7",
                config.cardBg,
                config.cardBorder,
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/40 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-teal-400/15 blur-2xl"
              />

              <div className="activity-section-in relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-[1.15rem] shadow-sm ring-1 ring-black/5",
                      config.iconBg,
                    )}
                  >
                    <Icon className={cn("h-6 w-6", config.iconColor)} />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-black/5">

                    {config.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <DialogTitle className="break-words text-left text-xl font-black leading-snug tracking-tight text-slate-900 [overflow-wrap:anywhere] sm:text-2xl">
                    {log.action}
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {relative}
                      </span>
                      <span className="hidden text-slate-300 sm:inline">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {format(created, "EEE, MMM d · h:mm a")}
                      </span>
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              <div
                className="activity-section-in grid grid-cols-2 gap-2.5"
                style={{ animationDelay: "60ms" }}
              >
                <div className="rounded-2xl border border-slate-100 bg-[#F7F8F9] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    When
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">
                    {format(created, "h:mm:ss a")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {format(created, "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-[#F7F8F9] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">
                    {config.label}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">
                    {log.resourceType || "General event"}
                  </p>
                </div>
              </div>

              <DetailBlock label="Performed by" delayMs={110}>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                  <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-md ring-1 ring-slate-100">
                    {log.user?.avatar ? (
                      <AvatarImage src={log.user.avatar} alt={log.user.name} />
                    ) : null}
                    <AvatarFallback className="bg-teal-800 text-sm font-bold text-white">
                      {getInitials(log.user?.name || "System")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="break-words text-base font-bold text-slate-900 [overflow-wrap:anywhere]">
                      {log.user?.name || "System"}
                    </p>
                    {log.user?.email && (
                      <p className="flex items-start gap-1.5 text-sm text-slate-500">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-all">{log.user.email}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {log.user?.role && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold capitalize text-teal-800 ring-1 ring-teal-100">
                          <UserRound className="h-3 w-3" />
                          {log.user.role.replace(/_/g, " ")}
                        </span>
                      )}
                      {log.user?._id && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-mono text-slate-500 ring-1 ring-slate-100">
                          <Fingerprint className="h-3 w-3 shrink-0" />
                          <span className="truncate">{log.user._id}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DetailBlock>

              <DetailBlock label="What happened" delayMs={160}>
                {detailEntries ? (
                  <div className="space-y-2">
                    {detailEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-100 bg-[#F7F8F9] p-3.5"
                      >
                        <p className="text-[11px] font-bold text-slate-500">
                          {formatKey(key)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800 [overflow-wrap:anywhere]">
                          {prettyValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-[#F7F8F9] p-3.5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                      {log.details ||
                        `${log.user?.name || "Someone"} performed “${log.action}” on the platform.`}
                    </p>
                  </div>
                )}
              </DetailBlock>

              {(log.resourceType || log.resourceId) && (
                <DetailBlock label="Linked resource" delayMs={210}>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <Target className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold capitalize text-slate-900">
                        {log.resourceType || "Resource"}
                      </p>
                      {log.resourceId && (
                        <p className="break-all font-mono text-xs leading-relaxed text-slate-500">
                          {String(log.resourceId)}
                        </p>
                      )}
                    </div>
                  </div>
                </DetailBlock>
              )}

              {metadataEntries.length > 0 && (
                <DetailBlock label="Extra metadata" delayMs={250}>
                  <div className="space-y-2">
                    {metadataEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-100 bg-white p-3.5"
                      >
                        <p className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <Layers className="h-3 w-3" />
                          {formatKey(key)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                          {prettyValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </DetailBlock>
              )}

              <DetailBlock label="Event identity" delayMs={290}>
                <div className="space-y-2 rounded-2xl border border-slate-100 bg-[#F7F8F9] p-3.5">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Event ID
                      </p>
                      <p className="break-all font-mono text-xs text-slate-700">
                        {log._id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border-t border-slate-200/70 pt-2 text-sm text-slate-600">
                    <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Full timestamp
                      </p>
                      <p className="break-words text-xs leading-relaxed text-slate-700">
                        {format(created, "EEEE, MMMM d, yyyy · h:mm:ss a")}
                      </p>
                      {log.updatedAt && log.updatedAt !== log.createdAt && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Updated{" "}
                          {format(
                            new Date(log.updatedAt),
                            "MMM d, yyyy · h:mm a",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </DetailBlock>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailDialog;
