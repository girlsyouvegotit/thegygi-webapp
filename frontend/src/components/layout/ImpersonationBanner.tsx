import { useState } from "react";
import { useNavigate } from "react-router";
import { EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuthContext";
import { readImpersonationSession } from "@/lib/impersonation";

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const { user, impersonation, endImpersonation } = useAuth();
  const [exiting, setExiting] = useState(false);

  const stored = readImpersonationSession();
  const active = Boolean(impersonation?.active || stored);
  if (!active || !user) return null;

  const watermark =
    impersonation?.watermark ||
    stored?.watermark ||
    `ACTING AS ${user.role.toUpperCase()}`;
  const targetName = stored?.target?.name || user.name;
  const actorName = impersonation?.actor?.name || stored?.actor?.name;

  const handleExit = async () => {
    setExiting(true);
    try {
      await endImpersonation();
      toast.success("Returned to your super-admin session");
      navigate("/super-admin/people");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to exit View as");
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-3 py-2.5 text-amber-950 sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold sm:text-sm">
          {watermark} · {targetName}
        </p>
        <p className="truncate text-[11px] font-medium text-amber-950/80">
          Full access as this user
          {actorName ? ` · you are ${actorName}` : ""}. Silent — not shown on
          their dashboards.
        </p>
      </div>
      <Button
        size="sm"
        disabled={exiting}
        className="h-8 shrink-0 rounded-full bg-amber-950 text-amber-50 hover:bg-black"
        onClick={() => void handleExit()}
      >
        {exiting ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <EyeOff className="mr-1 h-3.5 w-3.5" />
        )}
        Exit View as
      </Button>
    </div>
  );
}
