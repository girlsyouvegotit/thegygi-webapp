import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SaHubSkeleton } from "@/components/loading/PageSkeleton";
import {
  saCard,
  saPageShell,
  saPrimaryBtn,
  SaPageHeader,
  SaSoftButton,
} from "@/lib/superAdminStyles";
import { cn } from "@/lib/utils";

export function useSaHub<T>(path: string, errorMsg: string, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(path);
      const payload = res?.data?.hub ?? res?.data ?? res;
      setData(payload as T);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || errorMsg;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [path, errorMsg]);

  useEffect(() => {
    void load();
    if (!pollMs) return;
    const t = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(t);
  }, [load, pollMs]);

  return { data, loading, error, reload: load };
}

export function SaHubShell({
  title,
  subtitle,
  eyebrow = "GYGI Super Admin",
  loading,
  error,
  onRetry,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  if (loading) {
    return <SaHubSkeleton />;
  }

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {onRetry ? (
              <SaSoftButton onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </SaSoftButton>
            ) : null}
            {actions}
          </>
        }
      />

      {error ? (
        <div className={cn(saCard, "border-rose-100 bg-rose-50/40")}>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <p className="mt-1 text-xs text-rose-500">
            The hub could not load. Retry or check your session permissions.
          </p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className={cn(saPrimaryBtn, "mt-4")}>
              Retry
            </button>
          ) : null}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function SaSection({
  title,
  hint,
  children,
  className,
  actions,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn(saCard, "flex h-full flex-col", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {hint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
