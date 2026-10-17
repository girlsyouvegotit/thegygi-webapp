import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuthContext";
import { dashboardPathForRole } from "@/lib/roleHome";
import { cn } from "@/lib/utils";
import {
  Cloud,
  LostLearnerMascot,
} from "@/pages/public/NotFound";

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

/** Sky error page — same soft stage as the 404 “Oops, I think we're lost” screen. */
export default function AppErrorView({
  title = "Something went wrong",
  message = "We hit an unexpected snag. You can try again or head back home.",
  status,
  details,
  onRetry,
  className,
}: Props) {
  const { user } = useAuth();
  const homeHref = user ? dashboardPathForRole(user.role) : "/";
  const authHref = user ? dashboardPathForRole(user.role) : "/login";
  const authLabel = user ? "Dashboard" : "Log In";
  const isDev = import.meta.env.DEV;
  const mark = status != null ? String(status) : "Oops";

  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden font-[family-name:var(--font-sans)]",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, #c9a0e8 0%, #dcc4f0 28%, #ebe0f6 55%, #f4eef9 78%, #faf7fc 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Cloud className="absolute top-[18%] left-[-4%] h-24 w-48 animate-[nf-drift_28s_linear_infinite] opacity-70 sm:h-32 sm:w-64" />
        <Cloud className="absolute top-[28%] right-[-6%] h-20 w-44 animate-[nf-drift-rev_36s_linear_infinite] opacity-55 sm:h-28 sm:w-56" />
        <Cloud className="absolute top-[42%] left-[12%] h-16 w-36 animate-[nf-drift_40s_linear_infinite] opacity-40 sm:left-[22%]" />
        <Cloud className="absolute bottom-[22%] right-[8%] h-14 w-32 opacity-35" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <a href="/" className="flex items-center gap-2.5">
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-9 w-9 rounded-xl object-cover shadow-md ring-2 ring-white/70"
          />
          <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
            GYGI
          </span>
        </a>
        <a
          href={authHref}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#2D2D44] shadow-md transition hover:bg-white/95 active:scale-[0.98]"
        >
          {authLabel}
        </a>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5.5rem)] flex-col items-center justify-center px-5 pb-16 pt-6 text-center">
        <div className="relative mx-auto w-full max-w-3xl">
          <p
            aria-hidden
            className="pointer-events-none select-none text-[clamp(6.5rem,24vw,12rem)] leading-none font-black tracking-tight text-white/85 drop-shadow-[0_8px_32px_rgba(120,60,160,0.12)]"
          >
            {mark}
          </p>
          <div className="absolute top-[8%] left-1/2 w-[min(52%,16rem)] -translate-x-1/2 sm:top-[6%] sm:w-64">
            <div className="animate-[nf-bob_4.5s_ease-in-out_infinite]">
              <LostLearnerMascot className="mx-auto h-auto w-full drop-shadow-[0_18px_28px_rgba(90,40,130,0.22)]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-2 max-w-md animate-[nf-rise_0.7s_ease-out_both] sm:mt-0">
          <h1 className="text-[1.65rem] leading-tight font-extrabold tracking-tight text-[#2D2D44] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#6B6578] sm:text-base">{message}</p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2.5 rounded-full border border-[#E5E0EC] bg-white px-5 py-3 text-sm font-semibold text-[#2D2D44] shadow-[0_8px_24px_rgba(90,40,130,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(90,40,130,0.14)] active:translate-y-0"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D8D0E4] text-[#2D2D44]">
                <RefreshCw className="h-3.5 w-3.5" />
              </span>
              {onRetry ? "Try again" : "Reload page"}
            </button>
            <a
              href={homeHref}
              className="inline-flex items-center gap-2.5 rounded-full border border-[#E5E0EC] bg-white px-5 py-3 text-sm font-semibold text-[#2D2D44] shadow-[0_8px_24px_rgba(90,40,130,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(90,40,130,0.14)] active:translate-y-0"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D8D0E4] text-[#2D2D44]">
                <Home className="h-3.5 w-3.5" />
              </span>
              Back to home
            </a>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6578] transition hover:text-[#2D2D44]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </button>

          {isDev && details ? (
            <details className="mt-6 rounded-2xl bg-white/80 text-left shadow-sm open:pb-0">
              <summary className="cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-[#6B6578]">
                Technical details (dev only)
              </summary>
              <pre className="max-h-48 overflow-auto border-t border-[#E5E0EC] px-3.5 py-3 text-[11px] leading-relaxed whitespace-pre-wrap text-[#2D2D44]">
                {details}
              </pre>
            </details>
          ) : null}
        </div>
      </main>

      <style>{`
        @keyframes nf-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes nf-drift {
          0% { transform: translateX(0); }
          50% { transform: translateX(28px); }
          100% { transform: translateX(0); }
        }
        @keyframes nf-drift-rev {
          0% { transform: translateX(0); }
          50% { transform: translateX(-24px); }
          100% { transform: translateX(0); }
        }
        @keyframes nf-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
