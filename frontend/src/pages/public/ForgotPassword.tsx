import { useState } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Shield,
  Send,
  KeyRound,
  Heart,
} from "lucide-react";
import { AxiosError } from "axios";
import AuthGlassShell, {
  authFieldClass,
  authLabelClass,
  authPrimaryBtnClass,
} from "@/components/auth/AuthGlassShell";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("If that email exists, a reset link has been sent.");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message || "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthGlassShell
        greeting="Email sent"
        title="Check your inbox"
        subtitle="We've sent a password reset link if that address exists in GYGI."
        activeTab="forgot"
        features={[
          {
            icon: <Shield className="h-4 w-4" />,
            title: "Secure link",
            description: "Encrypted reset for your account",
          },
          {
            icon: <Heart className="h-4 w-4" />,
            title: "We care",
            description: "Your access stays protected",
          },
          {
            icon: <Mail className="h-4 w-4" />,
            title: "Try again",
            description: "Didn't get it? Resend the email",
            onClick: () => setSubmitted(false),
          },
        ]}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-[#f4f7fb] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F1FB] text-[#1d4e89]">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Sent to
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">
                  {email}
                </p>
              </div>
              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            Open the link in that email to choose a new password. Check spam if
            you don't see it within a few minutes.
          </p>

          <Link to="/login" className={authPrimaryBtnClass}>
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </AuthGlassShell>
    );
  }

  return (
    <AuthGlassShell
      greeting="Account recovery"
      title="Reset your password"
      subtitle="Enter your email and we'll send you a secure reset link."
      activeTab="forgot"
      tabs={[
        { id: "login", label: "Log in", to: "/login" },
        { id: "forgot", label: "Reset", to: "/forgot-password" },
      ]}
      features={[
        {
          icon: <Shield className="h-4 w-4" />,
          title: "Secure",
          description: "We protect your GYGI access",
        },
        {
          icon: <KeyRound className="h-4 w-4" />,
          title: "Fast",
          description: "Link usually arrives in minutes",
        },
        {
          icon: <Heart className="h-4 w-4" />,
          title: "Trusted",
          description: "Aiming for 500K+ learners by 2030+",
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex items-center gap-2 rounded-2xl bg-[#F8E4D4] px-3 py-2.5">
          <KeyRound className="h-4 w-4 text-[#9a5b3c]" />
          <p className="text-xs font-medium text-[#7a4a32]">Forgot Password · GYGI security</p>
        </div>

        <div className="space-y-1.5">
          <label className={authLabelClass}>Email Address</label>
          <div className="relative">
            <Mail
              className={cn(
                "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                isFocused === "email" ? "text-[#3d7ab5]" : "text-slate-400",
              )}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onFocus={() => setIsFocused("email")}
              onBlur={() => setIsFocused(null)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={authFieldClass(isFocused === "email", Boolean(error))}
            />
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !email}
          className={authPrimaryBtnClass}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1d4e89]/25 border-t-[#1d4e89]" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Reset Link
            </>
          )}
        </button>
      </form>
    </AuthGlassShell>
  );
}
