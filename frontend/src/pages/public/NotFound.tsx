import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuthContext";
import { dashboardPathForRole } from "@/lib/roleHome";
import { cn } from "@/lib/utils";

const gygiLogo = "/gygiLogo.jpg";

/** Soft sky 404 — GYGI brand, playful lost-path energy. */
export default function NotFound() {
  const { user } = useAuth();
  const homeHref = user ? dashboardPathForRole(user.role) : "/";
  const authHref = user ? dashboardPathForRole(user.role) : "/login";
  const authLabel = user ? "Dashboard" : "Log In";

  return (
    <div
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-sans)]"
      style={{
        background:
          "linear-gradient(180deg, #c9a0e8 0%, #dcc4f0 28%, #ebe0f6 55%, #f4eef9 78%, #faf7fc 100%)",
      }}
    >
      {/* Soft clouds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Cloud className="absolute top-[18%] left-[-4%] h-24 w-48 animate-[nf-drift_28s_linear_infinite] opacity-70 sm:h-32 sm:w-64" />
        <Cloud className="absolute top-[28%] right-[-6%] h-20 w-44 animate-[nf-drift-rev_36s_linear_infinite] opacity-55 sm:h-28 sm:w-56" />
        <Cloud className="absolute top-[42%] left-[12%] h-16 w-36 animate-[nf-drift_40s_linear_infinite] opacity-40 sm:left-[22%]" />
        <Cloud className="absolute bottom-[22%] right-[8%] h-14 w-32 opacity-35" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-9 w-9 rounded-xl object-cover shadow-md ring-2 ring-white/70"
          />
          <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
            GYGI
          </span>
        </Link>
        <Link
          to={authHref}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#2D2D44] shadow-md transition hover:bg-white/95 active:scale-[0.98]"
        >
          {authLabel}
        </Link>
      </header>

      {/* Stage */}
      <main className="relative z-10 flex min-h-[calc(100vh-5.5rem)] flex-col items-center justify-center px-5 pb-16 pt-6 text-center">
        <div className="relative mx-auto w-full max-w-3xl">
          {/* Giant 404 */}
          <p
            aria-hidden
            className="pointer-events-none select-none text-[clamp(7.5rem,28vw,14rem)] leading-none font-black tracking-tight text-white/85 drop-shadow-[0_8px_32px_rgba(120,60,160,0.12)]"
          >
            404
          </p>

          {/* Mascot over the zero */}
          <div className="absolute top-[8%] left-1/2 w-[min(52%,16rem)] -translate-x-1/2 sm:top-[6%] sm:w-64">
            <div className="animate-[nf-bob_4.5s_ease-in-out_infinite]">
              <LostLearnerMascot className="mx-auto h-auto w-full drop-shadow-[0_18px_28px_rgba(90,40,130,0.22)]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-2 max-w-md animate-[nf-rise_0.7s_ease-out_both] sm:mt-0">
          <h1 className="text-[1.65rem] leading-tight font-extrabold tracking-tight text-[#2D2D44] sm:text-3xl">
            Oops, I think we&apos;re lost
          </h1>
          <p className="mt-2 text-sm text-[#6B6578] sm:text-base">
            Let&apos;s get you back somewhere familiar…
          </p>

          <Link
            to={homeHref}
            className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#E5E0EC] bg-white px-5 py-3 text-sm font-semibold text-[#2D2D44] shadow-[0_8px_24px_rgba(90,40,130,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(90,40,130,0.14)] active:translate-y-0"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D8D0E4] text-[#2D2D44]">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            Back to home
          </Link>
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

function Cloud({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 80"
      className={cn("text-white", className)}
      fill="currentColor"
      aria-hidden
    >
      <ellipse cx="60" cy="48" rx="48" ry="28" opacity="0.85" />
      <ellipse cx="110" cy="40" rx="55" ry="32" opacity="0.9" />
      <ellipse cx="150" cy="50" rx="40" ry="24" opacity="0.8" />
    </svg>
  );
}

/** Friendly lost learner — soft 3D-ish SVG in GYGI magenta/violet. */
function LostLearnerMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Confused GYGI mascot"
    >
      <defs>
        <radialGradient id="nfBody" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="55%" stopColor="#c147e9" />
          <stop offset="100%" stopColor="#9b2ec9" />
        </radialGradient>
        <radialGradient id="nfBelly" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="100%" stopColor="#e9a8f5" />
        </radialGradient>
      </defs>

      {/* Ears */}
      <ellipse cx="68" cy="72" rx="22" ry="28" fill="url(#nfBody)" />
      <ellipse cx="172" cy="72" rx="22" ry="28" fill="url(#nfBody)" />
      <ellipse cx="68" cy="76" rx="12" ry="16" fill="#f0abfc" />
      <ellipse cx="172" cy="76" rx="12" ry="16" fill="#f0abfc" />

      {/* Body */}
      <ellipse cx="120" cy="150" rx="78" ry="86" fill="url(#nfBody)" />
      <ellipse cx="120" cy="168" rx="48" ry="42" fill="url(#nfBelly)" />

      {/* Face */}
      <ellipse cx="120" cy="118" rx="58" ry="52" fill="url(#nfBody)" />

      {/* Eyes */}
      <ellipse cx="98" cy="112" rx="16" ry="18" fill="white" />
      <ellipse cx="142" cy="112" rx="16" ry="18" fill="white" />
      <ellipse cx="100" cy="114" rx="7" ry="8" fill="#2D2D44" />
      <ellipse cx="144" cy="114" rx="7" ry="8" fill="#2D2D44" />
      <circle cx="102" cy="111" r="2.2" fill="white" />
      <circle cx="146" cy="111" r="2.2" fill="white" />

      {/* Brows — worried */}
      <path
        d="M84 96c8-8 22-8 28-2"
        stroke="#7a1fa8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M128 94c6-6 20-6 28 2"
        stroke="#7a1fa8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Mouth */}
      <path
        d="M108 138c4 8 20 8 24 0"
        stroke="#7a1fa8"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheeks */}
      <ellipse cx="78" cy="128" rx="10" ry="6" fill="#f0abfc" opacity="0.7" />
      <ellipse cx="162" cy="128" rx="10" ry="6" fill="#f0abfc" opacity="0.7" />

      {/* Arm on head */}
      <path
        d="M168 130c22-8 34-28 28-48-4-12-18-16-28-8"
        stroke="url(#nfBody)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="190" cy="78" rx="14" ry="12" fill="#c147e9" transform="rotate(-20 190 78)" />

      {/* Feet */}
      <ellipse cx="92" cy="232" rx="22" ry="12" fill="#9b2ec9" />
      <ellipse cx="148" cy="232" rx="22" ry="12" fill="#9b2ec9" />

      {/* Tiny book badge — GYGI learning cue */}
      <g transform="translate(96 175)">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#5B5FEF" />
        <rect x="3" y="3" width="22" height="16" rx="2" fill="#fff" opacity="0.9" />
        <path d="M14 3v16" stroke="#5B5FEF" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
