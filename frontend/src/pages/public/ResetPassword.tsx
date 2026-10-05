import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  KeyRound,
} from "lucide-react";
import { AxiosError } from "axios";

const gygiLogo = "/gygiLogo.jpg";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength <= 1) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  const getStrengthColor = (strength: number): string => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      toast.success("Password reset successful! Please login.");
      navigate("/login");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const message =
        error.response?.data?.message || "Failed to reset password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* ============================================ */}
      {/* BACKGROUND EFFECTS */}
      {/* ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #c147e9 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Decorative curved lines */}
      <svg
        className="absolute top-10 right-0 w-[400px] opacity-[0.03] pointer-events-none"
        viewBox="0 0 400 300"
        fill="none"
      >
        <path
          d="M400 150C350 50 300 25 250 40C200 55 175 90 125 100C75 110 40 80 0 40"
          stroke="#c147e9"
          strokeWidth="30"
          strokeLinecap="round"
        />
      </svg>

      {/* ============================================ */}
      {/* NAVBAR */}
      {/* ============================================ */}
      <nav className="relative z-20 border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={gygiLogo}
                  alt="GYGI"
                  className="h-10 w-10 object-contain rounded-xl shadow-md border border-primary/20"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white"></span>
              </div>
              <span className="text-xl font-black text-foreground">
                GYGI<span className="text-primary">.</span>
              </span>
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-primary/20"
            >
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-[32px] border border-primary/10 bg-white p-6 shadow-2xl shadow-primary/10 sm:p-8">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-3.5 shadow-lg shadow-primary/30">
                <KeyRound className="h-7 w-7 text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="mb-6 text-center">
              <span className="mb-2 inline-flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                <span className="h-0.5 w-8 rounded-full bg-primary"></span>
                Reset Password
                <span className="h-0.5 w-8 rounded-full bg-primary"></span>
              </span>
              <h1 className="text-2xl font-black tracking-[-0.03em] text-foreground leading-[1.05] sm:text-3xl">
                Set New <span className="text-primary">Password</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-3">
                Enter your new password below to secure your account.
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Secure Connection
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      isFocused === "password"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setIsFocused("password")}
                    onBlur={() => setIsFocused(null)}
                    placeholder="Enter new password"
                    required
                    className={`w-full pl-12 pr-12 py-3.5 bg-background border rounded-2xl focus:outline-none transition-all duration-300 text-foreground placeholder:text-muted-foreground/60 text-sm ${
                      isFocused === "password"
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength
                              ? getStrengthColor(passwordStrength)
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Password strength:
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength <= 1
                            ? "text-red-500"
                            : passwordStrength <= 3
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {getStrengthLabel(passwordStrength)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      isFocused === "confirmPassword"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    onFocus={() => setIsFocused("confirmPassword")}
                    onBlur={() => setIsFocused(null)}
                    placeholder="Confirm new password"
                    required
                    className={`w-full pl-12 pr-12 py-3.5 bg-background border rounded-2xl focus:outline-none transition-all duration-300 text-foreground placeholder:text-muted-foreground/60 text-sm ${
                      isFocused === "confirmPassword"
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div
                    className={`flex items-center gap-1.5 text-xs ${
                      password === confirmPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3.5 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl shadow-primary/25 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/15 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">
                  {loading ? "Resetting..." : "Reset Password"}
                </span>
                {!loading && (
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="text-primary hover:underline inline-flex items-center font-medium"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back to login
                </Link>
              </div>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              Secure
            </div>
            <span className="text-muted-foreground/40">•</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">

              Building toward 500K+ students by 2030+
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FLOATING DECORATIVE ELEMENTS */}
      {/* ============================================ */}
      <div className="absolute top-1/4 left-10 hidden lg:block animate-float-slow">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary/60" />
        </div>
      </div>
      <div
        className="absolute bottom-1/4 right-10 hidden lg:block animate-float-slow"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-secondary/60" />
        </div>
      </div>

      {/* ============================================ */}
      {/* ANIMATIONS */}
      {/* ============================================ */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
