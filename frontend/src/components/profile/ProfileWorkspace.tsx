import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { ProfileCoverUpload } from "@/components/profile/ProfileCoverUpload";
import DashboardThemePicker from "@/components/theme/DashboardThemePicker";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ProfilePageSkeleton } from "@/components/loading/PageSkeleton";
import type { category, user as UserType } from "@/types";

export type ProfileRoleVariant =
  | "student"
  | "tutor"
  | "mentor"
  | "writer"
  | "admin";

interface ProfileWorkspaceProps {
  title?: string;
  subtitle: string;
  roleLabel: string;
  variant: ProfileRoleVariant;
  accentClassName?: string;
  tipTitle?: string;
  tipBody?: string;
  showCategories?: boolean;
}

interface ProfileFormData {
  name: string;
  bio: string;
  phone: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  website: string;
}

const softCard =
  "rounded-2xl border border-border/90 bg-card p-4 shadow-[0_10px_40px_rgba(28,28,33,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:rounded-3xl sm:p-5 lg:p-6";

const fieldLabel =
  "mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase sm:text-[11px]";

const VARIANT_ACCENT: Record<ProfileRoleVariant, string> = {
  student: "from-primary via-[#A855F7] to-[#7C3AED]",
  tutor: "from-primary via-[#A855F7] to-[#7C3AED]",
  mentor: "from-primary via-[#A855F7] to-[#7C3AED]",
  writer: "from-violet-600 via-primary to-[#7C3AED]",
  admin: "from-slate-800 via-slate-700 to-violet-700",
};

export function ProfileWorkspace({
  title = "Profile",
  subtitle,
  roleLabel,
  variant,
  accentClassName,
  tipTitle = "A clear photo builds trust",
  tipBody = "Upload a clear headshot so teammates and learners recognize you across the platform.",
  showCategories = true,
}: ProfileWorkspaceProps) {
  const { user, setUser, refreshUser, categories: authCategories } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    bio: "",
    phone: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const showSocials = variant === "writer" || variant === "admin";

  const isNamedCategory = useCallback((c: unknown): c is category => {
    if (!c || typeof c !== "object") return false;
    const cat = c as { _id?: unknown; name?: unknown };
    return Boolean(
      cat._id != null &&
        typeof cat.name === "string" &&
        cat.name.trim().length > 0,
    );
  }, []);

  const categoryIdOf = useCallback((c: unknown): string | null => {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (c && typeof c === "object" && "_id" in c) {
      const id = String((c as { _id: unknown })._id || "").trim();
      return id || null;
    }
    return null;
  }, []);

  const profileCategories = useMemo(() => {
    const map = new Map<string, category>();
    for (const c of authCategories) map.set(String(c._id), c);
    for (const c of fetchedCategories) map.set(String(c._id), c);
    return [...map.values()];
  }, [authCategories, fetchedCategories]);

  const categoryIdsKey = useMemo(() => {
    const ids = [
      ...(Array.isArray(user?.categories) ? user!.categories! : []),
      ...(Array.isArray(user?.assignedCategories)
        ? user!.assignedCategories!
        : []),
    ]
      .map((c) => categoryIdOf(c))
      .filter((id): id is string => Boolean(id))
      .sort();
    return ids.join(",");
  }, [user?.categories, user?.assignedCategories, categoryIdOf]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      bio: user.bio || "",
      phone: user.phone || "",
      twitter: user.socialLinks?.twitter || "",
      linkedin: user.socialLinks?.linkedin || "",
      instagram: user.socialLinks?.instagram || "",
      facebook: user.socialLinks?.facebook || "",
      website: user.socialLinks?.website || "",
    });
  }, [user]);

  useEffect(() => {
    if (!showCategories || !user?._id) return;

    let cancelled = false;
    const userCategories = Array.isArray(user.categories) ? user.categories : [];
    const userAssigned = Array.isArray(user.assignedCategories)
      ? user.assignedCategories
      : [];

    const loadCategories = async () => {
      setCategoriesLoading(true);
      const collected: category[] = [];

      try {
        // Seed from whatever is already on the auth user
        for (const c of [...userCategories, ...userAssigned]) {
          if (isNamedCategory(c)) collected.push(c);
        }

        const bareIds = new Set<string>();
        for (const c of [...userCategories, ...userAssigned]) {
          if (isNamedCategory(c)) continue;
          const id = categoryIdOf(c);
          if (id) bareIds.add(id);
        }

        // Students: enrollments are the source of truth
        if (variant === "student") {
          try {
            const { data } = await api.get("/enrollments/me");
            const enrollments = (data?.data?.enrollments || []) as Array<{
              category?: unknown;
            }>;
            for (const e of enrollments) {
              if (isNamedCategory(e.category)) {
                collected.push(e.category);
              } else {
                const id = categoryIdOf(e.category);
                if (id) bareIds.add(id);
              }
            }
          } catch {
            /* keep other sources */
          }
        }

        if (cancelled) return;

        // Resolve bare ObjectIds against the public catalog
        if (bareIds.size > 0) {
          try {
            const { data } = await api.get("/categories");
            const all = (data?.data?.categories || []) as category[];
            const byId = new Map(all.map((c) => [String(c._id), c]));
            for (const id of bareIds) {
              const hit = byId.get(id);
              if (hit) collected.push(hit);
            }
          } catch {
            /* keep other sources */
          }
        }

        if (cancelled) return;

        const uniq = [
          ...new Map(collected.map((c) => [String(c._id), c] as const)).values(),
        ];
        if (uniq.length > 0) {
          setFetchedCategories(uniq);
          // Hydrate auth user when categories were bare IDs so the rest of the app sees names
          setUser((prev) => {
            if (!prev) return prev;
            const prevNamed = [
              ...(Array.isArray(prev.categories) ? prev.categories : []),
              ...(Array.isArray(prev.assignedCategories)
                ? prev.assignedCategories
                : []),
            ].some(isNamedCategory);
            if (prevNamed) return prev;
            return { ...prev, categories: uniq };
          });
        }
      } catch {
        /* keep whatever we already show from authCategories */
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [
    showCategories,
    user?._id,
    categoryIdsKey,
    variant,
    isNamedCategory,
    categoryIdOf,
    setUser,
  ]);

  const dirty = useMemo(() => {
    if (!user) return false;
    const socialDirty =
      showSocials &&
      (formData.twitter.trim() !== (user.socialLinks?.twitter || "") ||
        formData.linkedin.trim() !== (user.socialLinks?.linkedin || "") ||
        formData.instagram.trim() !== (user.socialLinks?.instagram || "") ||
        formData.facebook.trim() !== (user.socialLinks?.facebook || "") ||
        formData.website.trim() !== (user.socialLinks?.website || ""));
    return (
      formData.name.trim() !== (user.name || "").trim() ||
      formData.bio.trim() !== (user.bio || "").trim() ||
      formData.phone.trim() !== (user.phone || "").trim() ||
      socialDirty
    );
  }, [formData, showSocials, user]);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
      };
      if (showSocials) {
        payload.socialLinks = {
          twitter: formData.twitter.trim(),
          linkedin: formData.linkedin.trim(),
          instagram: formData.instagram.trim(),
          facebook: formData.facebook.trim(),
          website: formData.website.trim(),
        };
      }
      const { data } = await api.put<{
        success: boolean;
        data?: { user: UserType };
      }>("/users/profile", payload);
      if (data?.data?.user) {
        setUser(data.data.user);
      } else {
        await refreshUser();
      }
      toast.success("Profile updated");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [formData, refreshUser, setUser, showSocials]);

  if (!user) {
    return <ProfilePageSkeleton />;
  }

  const gradient = accentClassName || VARIANT_ACCENT[variant];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-3 pb-24 pt-3 sm:space-y-6 sm:px-5 sm:pb-10 sm:pt-4 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
            {subtitle}
          </p>
        </div>
        <Button
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className="hidden h-10 shrink-0 rounded-full px-5 font-semibold sm:inline-flex"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100/90 bg-white shadow-[0_10px_40px_rgba(28,28,33,0.05)] sm:rounded-3xl">
        <ProfileCoverUpload fallbackGradientClassName={gradient} />

        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between min-[480px]:gap-4">
            <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-end min-[480px]:gap-4">
              <ProfileAvatarUpload size="xl" overlap showUploader={false} />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                    {user.name}
                  </h2>
                  <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/10">
                    {roleLabel}
                  </Badge>
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {user.email}
                </p>
                {user.bio ? (
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-slate-600">
                    {user.bio}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    Add a short bio to personalize your profile.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <section className={cn(softCard, "lg:col-span-7 xl:col-span-8")}>
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                Personal information
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Update how you appear across GYGI
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Update your photo
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    This image appears in the sidebar, live classes, and messages.
                  </p>
                </div>
                <div className="w-full sm:max-w-55">
                  <ProfileAvatarUpload showPreview={false} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${variant}-name`} className={fieldLabel}>
                Full name
              </label>
              <Input
                id={`${variant}-name`}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white"
              />
            </div>

            <div>
              <label htmlFor={`${variant}-bio`} className={fieldLabel}>
                Bio
              </label>
              <Textarea
                id={`${variant}-bio`}
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="A short introduction…"
                rows={5}
                className="min-h-30 resize-y rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${variant}-phone`} className={fieldLabel}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id={`${variant}-phone`}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+234…"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus-visible:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={user.email}
                    disabled
                    className="h-11 rounded-xl border-slate-200 bg-slate-100/80 pl-10 text-slate-500"
                  />
                </div>
              </div>
            </div>

            {showSocials ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-border dark:bg-muted/40">
                <p className="text-sm font-bold text-slate-900 dark:text-foreground">
                  Public social links
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                  Shown on the Journal writers rail
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["twitter", "Twitter / X"],
                      ["linkedin", "LinkedIn"],
                      ["instagram", "Instagram"],
                      ["facebook", "Facebook"],
                      ["website", "Website"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className={key === "website" ? "sm:col-span-2" : undefined}>
                      <label htmlFor={`${variant}-${key}`} className={fieldLabel}>
                        {label}
                      </label>
                      <Input
                        id={`${variant}-${key}`}
                        type="url"
                        value={formData[key]}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder="https://"
                        className="h-11 rounded-xl border-slate-200 bg-white focus-visible:bg-white dark:border-border dark:bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
                <p className="text-sm font-bold text-foreground">
                  How your profile is used
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>· Name & photo show in live classes and community</li>
                  <li>· Mentors and tutors use your bio to support you</li>
                  <li>· Email stays private — never shown publicly</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
                <p className="text-sm font-bold text-foreground">
                  Profile tips
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>· Use a clear, well-lit headshot</li>
                  <li>· Keep your bio short and welcoming</li>
                  <li>· Add a reachable phone for mentor check-ins</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-sm font-bold text-foreground">
                Privacy & photo lock
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Profile photos can only be changed every 30 days after a
                successful upload. Your email cannot be edited here — contact
                support if you need to update it.
              </p>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
          <section className={softCard}>
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  Color mode
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Light, dark, or match your device
                </p>
              </div>
              <ThemeToggle variant="segmented" className="w-full" />
            </div>
          </section>

          <DashboardThemePicker />

          <section className={softCard}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Account</h3>
                <p className="text-sm text-slate-500">Read-only details</p>
              </div>
            </div>
            <dl className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-3.5 py-3 sm:px-4">
                <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Role
                </dt>
                <dd className="mt-1">
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                    {roleLabel}
                  </Badge>
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3.5 py-3 sm:px-4">
                <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Member since
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMMM d, yyyy")
                    : "—"}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3.5 py-3 sm:px-4">
                <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Last login
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), "MMM d, yyyy · h:mm a")
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          {showCategories ? (
            <section className={softCard}>
              <h3 className="text-base font-bold text-slate-900">Categories</h3>
              {categoriesLoading ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
                  <span className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
              ) : profileCategories.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profileCategories.map((cat) => (
                    <Badge
                      key={cat._id}
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No categories yet. Enroll in a learning path to see it here.
                </p>
              )}
            </section>
          ) : null}

          <section
            className={cn(
              "rounded-2xl bg-gradient-to-br p-5 text-white shadow-[0_12px_40px_rgba(193,71,233,0.28)] sm:rounded-3xl",
              gradient,
            )}
          >
            <p className="text-xs font-semibold text-white/70">Tip</p>
            <p className="mt-2 text-lg font-black leading-snug">{tipTitle}</p>
            <p className="mt-2 text-sm text-white/75">{tipBody}</p>
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Button
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className="h-11 w-full rounded-full font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : dirty ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </>
          ) : (
            "No changes"
          )}
        </Button>
      </div>
    </div>
  );
}

export default ProfileWorkspace;
