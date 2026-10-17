import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Code2,
  Palette,
  Brain,
  Database,
  Shield,
  Bot,
  Check,
  GraduationCap,
  Users,
  HeartHandshake,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { api } from "@/lib/api";
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

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  studentCount?: number;
  students?: unknown[];
}

const normalizeCategories = (raw: unknown): Category[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const c = item as Category & { id?: string };
      const id = c._id || c.id || c.slug;
      if (!id || !c.name) return null;
      return {
        ...c,
        _id: String(id),
        studentCount:
          c.studentCount ??
          (Array.isArray(c.students) ? c.students.length : 0),
      } as Category;
    })
    .filter(Boolean) as Category[];
};

const Register = () => {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError("");
    try {
      const response = await api.get("/categories");
      const fetchedCategories = normalizeCategories(
        response.data?.data?.categories ||
          response.data?.categories ||
          response.data,
      );

      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        setCategories([]);
        setCategoriesError(
          "No categories available yet. Please contact an admin.",
        );
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategoriesError("Could not load categories. Please try again later.");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateStep1 = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setError("");
      if (categories.length === 0) {
        void fetchCategories();
      }
    }
  };

  const handleBackStep = () => {
    setStep(1);
    setError("");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCategory || selectedCategory.trim() === "") {
      setError("Please select a learning category to continue");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(name, email, password, selectedCategory);
      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    "web-development": <Code2 className="w-4 h-4" />,
    "web-dev": <Code2 className="w-4 h-4" />,
    "ui-ux-design": <Palette className="w-4 h-4" />,
    "ui-ux": <Palette className="w-4 h-4" />,
    "ai-engineering": <Brain className="w-4 h-4" />,
    "ai-eng": <Brain className="w-4 h-4" />,
    "data-science": <Database className="w-4 h-4" />,
    "data-sci": <Database className="w-4 h-4" />,
    cybersecurity: <Shield className="w-4 h-4" />,
    "cyber-sec": <Shield className="w-4 h-4" />,
    "ai-prompting": <Bot className="w-4 h-4" />,
    "ai-prompt": <Bot className="w-4 h-4" />,
  };

  const getCategoryIcon = (slug: string) =>
    categoryIcons[slug] || <BookOpen className="w-4 h-4" />;

  return (
    <>
      <PageSeo
        title={PAGE_SEO.register.title}
        description={PAGE_SEO.register.description}
        path="/register"
      />
      <AuthGlassShell
        wide
        greeting="Join GYGI free"
        title={step === 1 ? "Create your account" : "Choose your path"}
        subtitle={
          step === 1
            ? "Enter your details to get started with free excellent education."
            : "Select what you want to learn — mentorship is included."
        }
        activeTab="register"
        tabs={AUTH_TABS}
        features={
          step === 1
            ? [
                {
                  icon: <GraduationCap className="h-4 w-4" />,
                  title: "100% free",
                  description: "Programs funded by donors & partners",
                },
                {
                  icon: <Users className="h-4 w-4" />,
                  title: "Community",
                  description: "Learn with peers across Africa",
                },
                {
                  icon: <HeartHandshake className="h-4 w-4" />,
                  title: "Mentor matched",
                  description: "Guidance from day one",
                },
              ]
            : undefined
        }
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider",
              step === 1
                ? "bg-[#E7F1FB] text-[#1d4e89]"
                : "bg-slate-100 text-slate-400",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                step === 1 ? "bg-[#7eb0de] text-white" : "bg-slate-200 text-slate-500",
              )}
            >
              1
            </span>
            Account
          </div>
          <div
            className={cn(
              "h-px flex-1",
              step >= 2 ? "bg-[#9ec4ea]" : "bg-slate-200",
            )}
          />
          <div
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider",
              step === 2
                ? "bg-[#E7F1FB] text-[#1d4e89]"
                : "bg-slate-100 text-slate-400",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                step === 2 ? "bg-[#7eb0de] text-white" : "bg-slate-200 text-slate-500",
              )}
            >
              2
            </span>
            Category
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className={authLabelClass}>Full Name</label>
                <div className="relative">
                  <User
                    className={cn(
                      "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
                      isFocused === "name" ? "text-[#3d7ab5]" : "text-slate-400",
                    )}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsFocused("name")}
                    onBlur={() => setIsFocused(null)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                    className={authFieldClass(isFocused === "name")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={authLabelClass}>Email Address</label>
                <div className="relative">
                  <Mail
                    className={cn(
                      "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
                      isFocused === "email"
                        ? "text-[#3d7ab5]"
                        : "text-slate-400",
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={authLabelClass}>Password</label>
                  <div className="relative">
                    <Lock
                      className={cn(
                        "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
                        isFocused === "password"
                          ? "text-[#3d7ab5]"
                          : "text-slate-400",
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
                      autoComplete="new-password"
                      className={authFieldClass(
                        isFocused === "password",
                        false,
                        true,
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={authEyeBtnClass}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={2.5} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={authLabelClass}>Confirm</label>
                  <div className="relative">
                    <Lock
                      className={cn(
                        "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
                        isFocused === "confirm"
                          ? "text-[#3d7ab5]"
                          : "text-slate-400",
                      )}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setIsFocused("confirm")}
                      onBlur={() => setIsFocused(null)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className={authFieldClass(
                        isFocused === "confirm",
                        false,
                        true,
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={authEyeBtnClass}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={2.5} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleNextStep}
                className={authPrimaryBtnClass}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <label className={authLabelClass}>
                  What do you want to learn?
                </label>

                {categoriesError ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {categoriesError}
                  </p>
                ) : null}

                {loadingCategories ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#7eb0de]" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="space-y-3 py-6 text-center">
                    <p className="text-sm text-slate-500">
                      No categories available.
                    </p>
                    <button
                      type="button"
                      onClick={() => void fetchCategories()}
                      className="text-sm font-semibold text-[#1d4e89] hover:underline"
                    >
                      Retry loading categories
                    </button>
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                    {categories.map((category) => {
                      const categoryId =
                        category._id || category.slug || category.name;
                      const selected = selectedCategory === categoryId;
                      return (
                        <button
                          key={categoryId}
                          type="button"
                          onClick={() => handleCategorySelect(categoryId)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                            selected
                              ? "border-[#9ec4ea] bg-[#E7F1FB]"
                              : "border-slate-200 bg-[#f4f7fb] hover:border-slate-300 hover:bg-white",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              selected
                                ? "bg-[#c5dff6] text-[#1d4e89]"
                                : "bg-white text-[#5b93c9]",
                            )}
                          >
                            {getCategoryIcon(category.slug)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {category.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              {category.description}
                            </p>
                          </div>
                          {selected ? (
                            <Check className="h-4 w-4 shrink-0 text-[#1d4e89]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error ? (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(authPrimaryBtnClass, "flex-1")}
                >
                  {isSubmitting
                    ? "Creating account..."
                    : selectedCategory
                      ? "Create Account"
                      : "Select a Category"}
                </button>
              </div>
            </div>
          )}
        </form>
      </AuthGlassShell>
    </>
  );
};

export default Register;
