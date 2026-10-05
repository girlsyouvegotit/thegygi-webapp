import { useState } from "react";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type LogoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

/**
 * Sky-gradient logout confirm — same soft GYGI energy as the 404 page.
 */
export function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "max-w-[min(24rem,calc(100%-1.5rem))] overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-[0_24px_64px_rgba(90,40,130,0.22)]",
          "gap-0 sm:max-w-md",
        )}
      >
        <div
          className="relative overflow-hidden px-6 pb-6 pt-7 text-center sm:px-8 sm:pb-7 sm:pt-8"
          style={{
            background:
              "linear-gradient(180deg, #c9a0e8 0%, #dcc4f0 32%, #ebe0f6 62%, #f7f2fa 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <Cloud className="absolute top-[12%] left-[-8%] h-14 w-32 opacity-70" />
            <Cloud className="absolute top-[30%] right-[-10%] h-12 w-28 opacity-50" />
            <Cloud className="absolute bottom-[18%] left-[18%] h-10 w-24 opacity-35" />
          </div>

          <div className="relative z-10 mx-auto w-28 animate-[lo-bob_4.5s_ease-in-out_infinite] sm:w-32">
            <WaveMascot className="mx-auto h-auto w-full drop-shadow-[0_14px_22px_rgba(90,40,130,0.2)]" />
          </div>

          <AlertDialogTitle className="relative z-10 mt-4 text-[1.35rem] font-extrabold tracking-tight text-[#2D2D44] sm:text-2xl">
            Heading out?
          </AlertDialogTitle>
          <AlertDialogDescription className="relative z-10 mt-1.5 text-sm text-[#6B6578]">
            Your session will end on this device. You can sign back in anytime.
          </AlertDialogDescription>

          <div className="relative z-10 mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#E5E0EC] bg-white px-5 text-sm font-semibold text-[#2D2D44] shadow-[0_6px_18px_rgba(90,40,130,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(90,40,130,0.12)] active:translate-y-0 disabled:opacity-60"
            >
              Stay logged in
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleConfirm()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2D2D44] px-5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(45,45,68,0.28)] transition hover:-translate-y-0.5 hover:bg-[#232336] active:translate-y-0 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {busy ? "Signing out…" : "Log out"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes lo-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      </AlertDialogContent>
    </AlertDialog>
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

/** Friendly wave — GYGI magenta/violet mascot for goodbye. */
function WaveMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GYGI mascot waving goodbye"
    >
      <defs>
        <radialGradient id="loBody" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="55%" stopColor="#c147e9" />
          <stop offset="100%" stopColor="#9b2ec9" />
        </radialGradient>
        <radialGradient id="loBelly" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="100%" stopColor="#e9a8f5" />
        </radialGradient>
      </defs>

      <ellipse cx="68" cy="70" rx="20" ry="26" fill="url(#loBody)" />
      <ellipse cx="172" cy="70" rx="20" ry="26" fill="url(#loBody)" />
      <ellipse cx="68" cy="74" rx="11" ry="15" fill="#f0abfc" />
      <ellipse cx="172" cy="74" rx="11" ry="15" fill="#f0abfc" />

      <ellipse cx="120" cy="145" rx="72" ry="78" fill="url(#loBody)" />
      <ellipse cx="120" cy="160" rx="44" ry="38" fill="url(#loBelly)" />
      <ellipse cx="120" cy="112" rx="54" ry="48" fill="url(#loBody)" />

      <ellipse cx="100" cy="108" rx="14" ry="16" fill="white" />
      <ellipse cx="140" cy="108" rx="14" ry="16" fill="white" />
      <ellipse cx="102" cy="110" rx="6" ry="7" fill="#2D2D44" />
      <ellipse cx="142" cy="110" rx="6" ry="7" fill="#2D2D44" />
      <circle cx="104" cy="107" r="2" fill="white" />
      <circle cx="144" cy="107" r="2" fill="white" />

      <path
        d="M108 130c5 10 19 10 24 0"
        stroke="#7a1fa8"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <ellipse cx="82" cy="122" rx="9" ry="5" fill="#f0abfc" opacity="0.7" />
      <ellipse cx="158" cy="122" rx="9" ry="5" fill="#f0abfc" opacity="0.7" />

      {/* Waving arm */}
      <path
        d="M178 128c18-4 32-2 38 14 4 12-2 24-14 28"
        stroke="url(#loBody)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="206"
        cy="168"
        rx="13"
        ry="11"
        fill="#c147e9"
        transform="rotate(25 206 168)"
      />

      <ellipse cx="96" cy="218" rx="20" ry="11" fill="#9b2ec9" />
      <ellipse cx="148" cy="218" rx="20" ry="11" fill="#9b2ec9" />
    </svg>
  );
}

export default LogoutDialog;
