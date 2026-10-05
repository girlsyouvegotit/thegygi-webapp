import { useState } from "react";
import useAuth from "@/hooks/useAuthContext";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  Video,
  HeartHandshake,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router";
import { dashboardPathForRole } from "@/lib/roleHome";
import { PageSeo } from "@/components/seo/PageSeo";
import { PAGE_SEO } from "@/lib/seo";
import AuthGlassShell, {
  authEyeBtnClass,
  authFieldClass,
  authLabelClass,
  authPrimaryBtnClass,
} from "@/components/auth/AuthGlassShell";
import { cn } from "@/lib/utils";

const AUTH_TABS = [
  { id: "login", label: "Log in", to: "/login" },
  { id: "register", label: "Create account", to: "/register" },
];

const Login = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  if (user && !loading) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const signedInUser = await signIn(email, password);
      navigate(dashboardPathForRole(signedInUser.role));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageSeo
        title={PAGE_SEO.login.title}
        description={PAGE_SEO.login.description}
        path="/login"
        noIndex
      />
      <AuthGlassShell
        greeting="Welcome back"
        title="Continue your journey"
        subtitle="Log in to live classes, mentorship, and your GYGI community."
        activeTab="login"
        tabs={AUTH_TABS}
        features={[
          {
            icon: <Users className="h-4 w-4" />,
            title: "500K+ by 2030+",
            description: "Our goal for learners across Africa",
          },
          {
            icon: <Video className="h-4 w-4" />,
            title: "Live classes",
            description: "Real-time sessions with tutors",
          },
          {
            icon: <HeartHandshake className="h-4 w-4" />,
            title: "Mentorship",
            description: "Personal guidance every step",
            to: "/register",
          },
        ]}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={authLabelClass}>Email Address</label>
            <div className="relative">
              <Mail
                className={cn(
                  "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                  isFocused === "email" ? "text-[#c147e9]" : "text-white/35",
                )}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused("email")}
                onBlur={() => setIsFocused(null)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={authFieldClass(isFocused === "email")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className={authLabelClass}>Password</label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-[#c147e9] hover:text-[#e879f9]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className={cn(
                  "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                  isFocused === "password" ? "text-[#c147e9]" : "text-white/35",
                )}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused("password")}
                onBlur={() => setIsFocused(null)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={authFieldClass(isFocused === "password", false, true)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={authEyeBtnClass}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(authPrimaryBtnClass, "flex-1")}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c147e9] text-white shadow-lg shadow-primary/40 transition hover:brightness-110 disabled:opacity-50"
              aria-label="Sign in"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>
      </AuthGlassShell>
    </>
  );
};

export default Login;
