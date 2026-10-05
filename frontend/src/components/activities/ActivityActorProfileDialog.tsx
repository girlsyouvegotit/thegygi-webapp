import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  Loader2,
  Mail,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/components/activities/activityConfig";
import { cn } from "@/lib/utils";
import type { user as UserType } from "@/types";

export type ActivityActorSummary = {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  email?: string;
  count: number;
  lastActionAt?: string;
  lastAction?: string;
};

interface ActivityActorProfileDialogProps {
  actor: ActivityActorSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityActorProfileDialog = ({
  actor,
  open,
  onOpenChange,
}: ActivityActorProfileDialogProps) => {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !actor || actor.id === "system") {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/users/${actor.id}`);
        const next = (data.data?.user || data.user) as UserType | undefined;
        if (!cancelled) {
          setProfile(next || null);
          if (!next) setError("Profile not found");
        }
      } catch {
        try {
          const { data } = await api.get(`/users/profile/${actor.id}`);
          const next = (data.data?.user || data.user) as UserType | undefined;
          if (!cancelled) {
            setProfile(next || null);
            if (!next) setError("Profile not found");
          }
        } catch {
          if (!cancelled) {
            setProfile(null);
            setError("Could not load this profile");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, actor]);

  const name = profile?.name || actor?.name || "Unknown";
  const role = profile?.role || actor?.role;
  const avatar = profile?.avatar || actor?.avatar;
  const email = profile?.email || actor?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="z-[80] w-[calc(100vw-1.25rem)] max-w-md border-0 bg-transparent p-0 shadow-none sm:max-w-lg [&_button.absolute]:text-white/80 [&_button.absolute]:hover:text-white"
      >
        <div className="activity-modal-inner-bounce overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-950/80 text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <DialogHeader className="relative space-y-0 border-b border-white/10 px-5 pb-5 pt-6 text-left sm:px-7 sm:pt-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary/40 blur-3xl"
            />
            <div className="relative z-10 flex items-start gap-3.5 pr-8">
              <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg">
                {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                <AvatarFallback className="bg-primary text-base font-bold text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className="truncate text-xl font-black tracking-tight text-white">
                  {name}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {role ? (
                      <Badge className="rounded-full border-0 bg-white/15 text-white hover:bg-white/15">
                        {role.replace(/_/g, " ")}
                      </Badge>
                    ) : null}
                    {actor && actor.id !== "system" ? (
                      <span className="text-xs font-medium text-white/60">
                        {actor.count} timeline event
                        {actor.count === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[min(70dvh,28rem)] space-y-3 overflow-y-auto px-5 py-5 sm:px-7">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading profile…
              </div>
            ) : error && !profile ? (
              <p className="rounded-2xl bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : actor?.id === "system" ? (
              <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
                System events have no user profile.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <GlassTile
                    icon={Mail}
                    label="Email"
                    value={email || "—"}
                    className="sm:col-span-2"
                  />
                  <GlassTile
                    icon={Phone}
                    label="Phone"
                    value={profile?.phone || "—"}
                  />
                  <GlassTile
                    icon={Shield}
                    label="Status"
                    value={
                      profile?.isActive == null
                        ? "—"
                        : profile.isActive
                          ? "Active"
                          : "Inactive"
                    }
                  />
                  <GlassTile
                    icon={Calendar}
                    label="Member since"
                    value={
                      profile?.createdAt
                        ? format(new Date(profile.createdAt), "MMM d, yyyy")
                        : "—"
                    }
                  />
                  <GlassTile
                    icon={Clock}
                    label="Last login"
                    value={
                      profile?.lastLoginAt
                        ? formatDistanceToNow(new Date(profile.lastLoginAt), {
                            addSuffix: true,
                          })
                        : "—"
                    }
                  />
                </div>

                {profile?.bio ? (
                  <div className="rounded-2xl bg-white/10 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Bio
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/85">
                      {profile.bio}
                    </p>
                  </div>
                ) : null}

                {profile?.categories && profile.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.categories.map((cat) => (
                      <Badge
                        key={cat._id}
                        className="rounded-full border-0 bg-white/12 text-white hover:bg-white/12"
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {actor?.lastActionAt ? (
                  <div className="rounded-2xl bg-primary/25 p-3.5 ring-1 ring-white/10">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                          Latest on timeline
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-white">
                          {actor.lastAction || "Activity"}
                        </p>
                        <p className="mt-0.5 text-xs text-white/60">
                          {format(
                            new Date(actor.lastActionAt),
                            "EEE, MMM d · h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GlassTile = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={cn("rounded-2xl bg-white/10 p-3", className)}>
    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
      <Icon className="h-3 w-3" />
      {label}
    </p>
    <p className="mt-1 break-all text-sm font-semibold text-white/90">{value}</p>
  </div>
);

export default ActivityActorProfileDialog;
