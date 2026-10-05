import { Link } from "react-router";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const gygiLogo = "/gygiLogo.jpg";

type Props = {
  title?: string;
  message?: string;
  status?: number | string;
  /** Shown only in development */
  details?: string;
  onRetry?: () => void;
  className?: string;
};

/** Shared GYGI glass error surface — used by route errors + React boundary. */
export default function AppErrorView({
  title = "Something went wrong",
  message = "We hit an unexpected snag. You can try again or head back home.",
  status,
  details,
  onRetry,
  className,
}: Props) {
  const isDev = import.meta.env.DEV;

  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050508] px-4 py-10",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(193,71,233,0.28), transparent 55%), radial-gradient(ellipse 45% 35% at 90% 90%, rgba(91,95,239,0.16), transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/20"
          />
          <span className="text-lg font-black text-white">
            GYGI<span className="text-[#c147e9]">.</span>
          </span>
        </Link>

        <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c147e9]/15 text-[#e879f9] ring-1 ring-[#c147e9]/25">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {status != null ? (
                <p className="text-[10px] font-bold tracking-[0.16em] text-[#c147e9] uppercase">
                  Error {status}
                </p>
              ) : (
                <p className="text-[10px] font-bold tracking-[0.16em] text-[#c147e9] uppercase">
                  Application error
                </p>
              )}
              <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {message}
              </p>
            </div>
          </div>

          {isDev && details ? (
            <details className="mt-5 rounded-2xl border border-white/10 bg-black/30 open:pb-0">
              <summary className="cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-white/45 hover:text-white/70">
                Technical details (dev only)
              </summary>
              <pre className="max-h-48 overflow-auto border-t border-white/8 px-3.5 py-3 text-[11px] leading-relaxed whitespace-pre-wrap text-rose-200/90">
                {details}
              </pre>
            </details>
          ) : null}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c147e9] via-[#b03ad4] to-[#5B5FEF] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(193,71,233,0.35)] transition hover:brightness-110"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c147e9] via-[#b03ad4] to-[#5B5FEF] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(193,71,233,0.35)] transition hover:brightness-110"
              >
                <RefreshCw className="h-4 w-4" />
                Reload page
              </button>
            )}
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/[0.08]"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-white/40 transition hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/30">
          If this keeps happening, contact GYGI support.
        </p>
      </div>
    </div>
  );
}

export function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join("\n");
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}
