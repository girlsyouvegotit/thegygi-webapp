import { useState } from "react";
import { Check, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_THEMES,
  getDashboardTheme,
} from "@/lib/dashboardThemes";
import type { user as UserType } from "@/types";

interface DashboardThemePickerProps {
  className?: string;
}

const DashboardThemePicker = ({ className }: DashboardThemePickerProps) => {
  const { user, setUser } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
  const current = getDashboardTheme(user?.dashboardTheme);

  const selectTheme = async (themeId: string) => {
    if (!user || themeId === current.id || savingId) return;
    setSavingId(themeId);
    try {
      const { data } = await api.put<{
        success: boolean;
        data?: { user?: UserType };
      }>("/users/profile/dashboard-theme", { theme: themeId });

      const next = data.data?.user;
      if (next) {
        const hasNamed = (list: UserType["categories"] | undefined) =>
          (list || []).some(
            (c) =>
              c &&
              typeof c === "object" &&
              typeof (c as { name?: unknown }).name === "string" &&
              String((c as { name: string }).name).trim(),
          );
        setUser({
          ...user,
          ...next,
          dashboardTheme: themeId,
          categories: hasNamed(next.categories)
            ? next.categories
            : hasNamed(user.categories)
              ? user.categories
              : next.categories,
          assignedCategories: hasNamed(next.assignedCategories)
            ? next.assignedCategories
            : hasNamed(user.assignedCategories)
              ? user.assignedCategories
              : next.assignedCategories,
        });
      } else {
        setUser({ ...user, dashboardTheme: themeId });
      }
      toast.success("Dashboard theme updated");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not update theme");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/90 bg-card p-4 shadow-[0_10px_40px_rgba(28,28,33,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Palette className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">Dashboard accent</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick an accent for your dashboard · {current.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {DASHBOARD_THEMES.map((theme) => {
          const selected = theme.id === current.id;
          const busy = savingId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={Boolean(savingId)}
              onClick={() => void selectTheme(theme.id)}
              title={`${theme.name} — ${theme.description}`}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-2xl p-2 transition",
                selected
                  ? "bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:bg-muted/70",
                savingId && !busy && "opacity-60",
              )}
            >
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1 ring-border"
                style={{ background: theme.swatch }}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white drop-shadow" />
                ) : selected ? (
                  <Check className="h-4 w-4 text-white drop-shadow" />
                ) : null}
              </span>
              <span className="w-full truncate text-center text-[10px] font-semibold text-muted-foreground">
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardThemePicker;
