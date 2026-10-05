import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Palette,
  Loader2,
  Settings as SettingsIcon,
  Shield,
  Save,
  Info,
  Image as ImageIcon,
  Bell,
  Lock,
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  KeyRound,
  Timer,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skel } from "@/components/loading/PageSkeleton";
import { enableWebPush } from "@/lib/webPush";

type SettingsRole = "student" | "tutor" | "mentor" | "admin";

interface GeneralSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  primaryColor: string;
  logo: string;
}

interface PermissionModule {
  module: string;
  actions: string[];
}

interface NotificationSettings {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  events: Record<string, boolean>;
}

interface SecuritySettings {
  require2faForAdmins: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
  allowSelfRegistration: boolean;
  forcePasswordResetDays: number;
}

const COLOR_PRESETS = [
  "#c147e9",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const ROLES: { value: SettingsRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Learners & enrolled users" },
  { value: "tutor", label: "Tutor", hint: "Class creators & facilitators" },
  { value: "mentor", label: "Mentor", hint: "1:1 mentorship guidance" },
  { value: "admin", label: "Admin", hint: "Platform operators" },
];

const ALL_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "join",
  "start",
  "end",
  "watch",
  "download",
  "submit",
  "grade",
  "launch",
  "announce",
  "moderate",
  "assign",
  "suspend",
] as const;

const EVENT_LABELS: Record<string, string> = {
  class_scheduled: "Class scheduled",
  class_starting: "Class starting soon",
  recording_available: "Recording available",
  quiz_result: "Quiz results",
  assignment_graded: "Assignment graded",
  mentor_assigned: "Mentor assigned",
  session_reminder: "Session reminders",
  fee_reminder: "Fee reminders",
  platform_announcement: "Platform announcements",
  get_involved_inquiry: "Get Involved inquiries",
};

const MOBILE_STEPS = [
  { id: "platform", label: "Platform" },
  { id: "branding", label: "Branding" },
  { id: "preview", label: "Preview" },
] as const;

const emptySchool: GeneralSettings = {
  name: "GYGI Platform",
  email: "contact@gygi.org",
  phone: "",
  address: "",
  website: "",
  primaryColor: "#c147e9",
  logo: "",
};

const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [mobileStep, setMobileStep] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [generalSettings, setGeneralSettings] =
    useState<GeneralSettings>(emptySchool);
  const [rolePermissions, setRolePermissions] = useState<
    Record<SettingsRole, PermissionModule[]>
  >({
    student: [],
    tutor: [],
    mentor: [],
    admin: [],
  });
  const [selectedRole, setSelectedRole] = useState<SettingsRole>("student");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    events: {},
  });
  const [security, setSecurity] = useState<SecuritySettings>({
    require2faForAdmins: false,
    sessionTimeoutMinutes: 480,
    maxLoginAttempts: 5,
    lockoutMinutes: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    allowSelfRegistration: true,
    forcePasswordResetDays: 0,
  });
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [school, roles, notif, sec] = await Promise.all([
        api.get("/settings/school"),
        api.get("/settings/roles"),
        api.get("/settings/notifications"),
        api.get("/settings/security"),
      ]);
      setGeneralSettings({ ...emptySchool, ...school.data.data });
      setRolePermissions(roles.data.data);
      setNotifications(notif.data.data);
      setSecurity(sec.data.data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const updateField = (field: keyof GeneralSettings, value: string) => {
    setGeneralSettings((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAction = (module: string, action: string) => {
    setRolePermissions((prev) => {
      const list = [...(prev[selectedRole] || [])];
      const idx = list.findIndex((m) => m.module === module);
      if (idx < 0) {
        list.push({ module, actions: [action] });
      } else {
        const actions = new Set(list[idx].actions);
        if (actions.has(action)) actions.delete(action);
        else actions.add(action);
        list[idx] = { module, actions: Array.from(actions) };
      }
      return { ...prev, [selectedRole]: list };
    });
  };

  const hasAction = (module: string, action: string) =>
    (rolePermissions[selectedRole] || []).some(
      (m) => m.module === module && m.actions.includes(action),
    );

  const modulesForRole = useMemo(() => {
    const list = rolePermissions[selectedRole] || [];
    return list.length
      ? list
      : [{ module: "dashboard", actions: ["read"] }];
  }, [rolePermissions, selectedRole]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "general") {
        await api.put("/settings/school", generalSettings);
        toast.success("General settings saved");
      } else if (activeTab === "roles") {
        await api.put("/settings/roles", {
          role: selectedRole,
          permissions: rolePermissions[selectedRole],
        });
        toast.success(`${selectedRole} permissions saved`);
      } else if (activeTab === "notifications") {
        await api.put("/settings/notifications", notifications);
        toast.success("Alert settings saved");
      } else if (activeTab === "security") {
        await api.put("/settings/security", security);
        toast.success("Security settings saved");
      }
      await loadAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetRoleDefaults = async () => {
    try {
      const { data } = await api.get("/settings/roles");
      // Re-seed by saving known defaults from a fresh backend create isn't available;
      // reload then toast — admin can tweak. Better: call save with baked defaults.
      const defaults = data.data as Record<SettingsRole, PermissionModule[]>;
      setRolePermissions(defaults);
      toast.message("Reloaded permissions from server");
    } catch {
      toast.error("Could not reset");
    }
  };

  const goToStep = (index: number) => {
    const next = Math.max(0, Math.min(MOBILE_STEPS.length - 1, index));
    setMobileStep(next);
    const el = carouselRef.current;
    const slide = el?.children[next] as HTMLElement | undefined;
    slide?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  };

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    const clamped = Math.max(0, Math.min(MOBILE_STEPS.length - 1, index));
    if (clamped !== mobileStep) setMobileStep(clamped);
  };

  const fieldClass =
    "h-11 sm:h-10 bg-white border-slate-200 rounded-xl text-base sm:text-sm";
  const cardShell =
    "rounded-2xl border border-slate-200/60 bg-[#FAFAFC] p-4 sm:rounded-[28px] sm:p-5 md:p-6";

  const configStatus = [
    {
      label: "General",
      status: generalSettings.name ? "Configured" : "Empty",
      color: generalSettings.name ? "text-emerald-600" : "text-amber-600",
      bg: generalSettings.name ? "bg-emerald-50" : "bg-amber-50",
    },
    {
      label: "Roles",
      status: rolePermissions.admin?.length ? "Active" : "Default",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Alerts",
      status: notifications.emailEnabled || notifications.inAppEnabled
        ? "On"
        : "Off",
      color:
        notifications.emailEnabled || notifications.inAppEnabled
          ? "text-emerald-600"
          : "text-amber-600",
      bg:
        notifications.emailEnabled || notifications.inAppEnabled
          ? "bg-emerald-50"
          : "bg-amber-50",
    },
    {
      label: "Security",
      status: security.requireStrongPassword ? "Hardened" : "Basic",
      color: security.requireStrongPassword
        ? "text-emerald-600"
        : "text-amber-600",
      bg: security.requireStrongPassword ? "bg-emerald-50" : "bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1280px] space-y-4 py-4">
        <Skel className="h-12 w-64" />
        <Skel className="h-12 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skel className="h-64 w-full" />
          <Skel className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const platformForm = (
    <div className="space-y-3.5 sm:space-y-4">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-slate-400" /> Platform Name
        </label>
        <Input
          value={generalSettings.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Mail className="h-3.5 w-3.5 text-slate-400" /> Email
          </label>
          <Input
            type="email"
            value={generalSettings.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone
          </label>
          <Input
            value={generalSettings.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Globe className="h-3.5 w-3.5 text-slate-400" /> Website
        </label>
        <Input
          value={generalSettings.website}
          onChange={(e) => updateField("website", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-slate-400" /> Address
        </label>
        <Input
          value={generalSettings.address}
          onChange={(e) => updateField("address", e.target.value)}
          className={fieldClass}
        />
      </div>
    </div>
  );

  const brandingForm = (
    <div className="space-y-3.5 sm:space-y-4">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Palette className="h-3.5 w-3.5 text-slate-400" /> Primary Color
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={generalSettings.primaryColor}
            onChange={(e) => updateField("primaryColor", e.target.value)}
            className={cn(fieldClass, "font-mono flex-1")}
          />
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:h-10">
            <div
              className="h-6 w-6 rounded-lg border border-slate-200"
              style={{ backgroundColor: generalSettings.primaryColor }}
            />
            <span className="font-mono text-[11px] text-slate-400">Preview</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => updateField("primaryColor", color)}
            className={cn(
              "h-9 w-9 rounded-lg border-2 sm:h-8 sm:w-8",
              generalSettings.primaryColor === color
                ? "border-slate-900 ring-2 ring-slate-900/20"
                : "border-slate-200",
            )}
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Logo URL
        </label>
        <Input
          value={generalSettings.logo}
          onChange={(e) => updateField("logo", e.target.value)}
          className={fieldClass}
        />
      </div>
    </div>
  );

  const livePreview = (
    <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 sm:rounded-2xl sm:p-4">
      <div
        className="relative overflow-hidden rounded-xl p-3 text-white sm:rounded-xl sm:p-4"
        style={{
          background: `linear-gradient(135deg, ${generalSettings.primaryColor}, ${generalSettings.primaryColor}cc)`,
        }}
      >
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-20 w-20 rounded-full bg-white/10 blur-2xl sm:h-24 sm:w-24" />
        <div className="relative z-10 flex flex-col gap-3 sm:gap-0">
          <div className="flex items-center gap-2.5 sm:mb-3">
            {generalSettings.logo ? (
              <img
                src={generalSettings.logo}
                alt="Logo"
                className="h-9 w-9 shrink-0 rounded-xl border-2 border-white/30 object-cover sm:h-8 sm:w-8 sm:rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:h-8 sm:w-8 sm:rounded-lg">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold sm:text-xs">
                {generalSettings.name || "Platform Name"}
              </p>
              <p className="truncate text-[11px] text-white/75 sm:text-[10px]">
                {generalSettings.email || "contact@example.com"}
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-2.5 sm:pt-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
                Brand color
              </p>
              <p className="mt-0.5 break-all font-mono text-xs font-bold sm:text-sm">
                {generalSettings.primaryColor}
              </p>
            </div>
            <div
              className="h-8 w-8 shrink-0 rounded-lg border-2 border-white/40 shadow-inner sm:h-9 sm:w-9"
              style={{ backgroundColor: generalSettings.primaryColor }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );

  const configStatusCard = (
    <div className={cardShell}>
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Configuration</h3>
          <p className="text-[10px] text-slate-500">Current status</p>
        </div>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-1">
        {configStatus.map((item) => (
          <div
            key={item.label}
            className="flex min-w-[42%] shrink-0 snap-start items-center justify-between gap-2 rounded-xl border border-slate-200/60 bg-white p-2.5 sm:min-w-0"
          >
            <span className="truncate text-xs font-medium text-slate-600">
              {item.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                item.bg,
                item.color,
              )}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const saveLabel =
    activeTab === "general"
      ? "Save general"
      : activeTab === "roles"
        ? `Save ${selectedRole} roles`
        : activeTab === "notifications"
          ? "Save alerts"
          : "Save security";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1280px] pb-24 sm:pb-10">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md sm:h-11 sm:w-11">
            <SettingsIcon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <h1 className="text-base font-black text-slate-900 sm:text-lg">
                Settings
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-violet-600 uppercase sm:text-[10px]">

                Configuration
              </span>
            </div>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Manage your platform configuration
            </p>
          </div>
        </div>

        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          className="hidden h-9 gap-1.5 bg-violet-600 text-xs text-white shadow-md shadow-violet-600/25 hover:bg-violet-700 sm:inline-flex"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saveLabel}
        </Button>
      </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-3 sm:mb-4">
          <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-2xl border border-slate-200/60 bg-white p-1.5 sm:flex sm:w-fit">
            {[
              { value: "general", label: "General", short: "Gen", icon: Building2 },
              { value: "roles", label: "Roles", short: "Roles", icon: Shield },
              {
                value: "notifications",
                label: "Alerts",
                short: "Alert",
                icon: Bell,
              },
              { value: "security", label: "Security", short: "Sec", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-xs data-[state=active]:shadow-none",
                    isActive
                      ? "bg-violet-600 text-white data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* GENERAL */}
        <TabsContent value="general" className="mt-0">
          <div className="lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700">
                {MOBILE_STEPS[mobileStep]?.label} · {mobileStep + 1}/
                {MOBILE_STEPS.length}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={mobileStep === 0}
                  onClick={() => goToStep(mobileStep - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={mobileStep === MOBILE_STEPS.length - 1}
                  onClick={() => goToStep(mobileStep + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mb-3 flex gap-1.5">
              {MOBILE_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i === mobileStep ? "bg-violet-600" : "bg-slate-200",
                  )}
                />
              ))}
                    </div>
            <div
              ref={carouselRef}
              onScroll={onCarouselScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scrollbar-hide"
            >
              <section className={cn(cardShell, "min-w-full shrink-0 snap-center")}>
                <h3 className="mb-4 text-sm font-bold">Platform Information</h3>
                {platformForm}
              </section>
              <section className={cn(cardShell, "min-w-full shrink-0 snap-center")}>
                <h3 className="mb-4 text-sm font-bold">Branding</h3>
                {brandingForm}
              </section>
              <section className="flex min-w-full shrink-0 snap-center flex-col gap-3">
                <div className={cardShell}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">
                        Live Preview
                      </h3>
                      <p className="text-[10px] leading-snug text-slate-500 sm:text-[11px]">
                        See how your branding looks
                      </p>
                    </div>
                  </div>
                  {livePreview}
                    </div>
                {configStatusCard}
              </section>
                      </div>
                    </div>

          <div className="hidden grid-cols-12 gap-6 lg:grid">
            <div className="col-span-8 space-y-6">
              <div className={cardShell}>
                <h3 className="mb-5 text-sm font-bold">Platform Information</h3>
                {platformForm}
                    </div>
              <div className={cardShell}>
                <h3 className="mb-5 text-sm font-bold">Branding</h3>
                {brandingForm}
                    </div>
                  </div>
            <div className="col-span-4 space-y-6">
              <div className={cardShell}>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Preview
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    See how your branding looks
                  </p>
                </div>
                {livePreview}
                    </div>
              {configStatusCard}
                    </div>
                  </div>
        </TabsContent>

        {/* ROLES */}
        <TabsContent value="roles" className="mt-3 space-y-4 sm:mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
              <h2 className="text-sm font-bold text-slate-900">
                Roles & permissions
              </h2>
              <p className="text-xs text-slate-500">
                Toggle module actions per role. Save applies to the selected role.
              </p>
                        </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void resetRoleDefaults()}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reload
            </Button>
                      </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition",
                  selectedRole === r.value
                    ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <p className="text-sm font-bold text-slate-900">{r.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{r.hint}</p>
              </button>
            ))}
                    </div>

          <div className="space-y-3">
            {modulesForRole.map((mod) => (
              <div key={mod.module} className={cardShell}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold capitalize text-slate-900">
                    {mod.module.replace(/_/g, " ")}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {mod.actions.length} actions
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set([
                      ...mod.actions,
                      "read",
                      "create",
                      "update",
                      "delete",
                      ...ALL_ACTIONS.filter((a) =>
                        (rolePermissions[selectedRole] || []).some(
                          (m) => m.module === mod.module && m.actions.includes(a),
                        ),
                      ),
                    ]),
                  ).map((action) => {
                    const on = hasAction(mod.module, action);
                    return (
                          <button
                        key={action}
                            type="button"
                        onClick={() => toggleAction(mod.module, action)}
                            className={cn(
                          "rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition",
                          on
                            ? "bg-violet-600 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {action}
                      </button>
                    );
                  })}
                </div>
              </div>
                        ))}
                      </div>
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="notifications" className="mt-3 space-y-4 sm:mt-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Platform alert defaults
            </h2>
            <p className="text-xs text-slate-500">
              Users are notified via email, push, and in-app when a channel is on.
            </p>
                    </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                key: "emailEnabled" as const,
                label: "Email",
                icon: Mail,
                hint: "Inbox delivery for every alert",
              },
              {
                key: "inAppEnabled" as const,
                label: "In-app",
                icon: Bell,
                hint: "Bell & notification center",
              },
              {
                key: "pushEnabled" as const,
                label: "Push",
                icon: Zap,
                hint: "Browser & mobile push alerts",
              },
            ].map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white p-4"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3e0fb]">
                    <c.icon className="h-4 w-4 text-[#9b2ec4]" />
                    </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{c.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{c.hint}</p>
                  </div>
                </div>
                <Switch
                  checked={notifications[c.key]}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, [c.key]: v }))
                  }
                />
              </div>
            ))}
                    </div>

          <div className="rounded-2xl border border-[#c147e9]/20 bg-[#fbf5fd] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                <p className="text-sm font-bold text-[#2D2D44]">
                  Enable push on this device
                </p>
                <p className="text-[11px] text-slate-500">
                  Registers this browser for Web Push (requires VAPID keys on the
                  server). {pushStatus ? `Status: ${pushStatus}` : ""}
                      </p>
                    </div>
              <Button
                type="button"
                disabled={pushBusy || !notifications.pushEnabled}
                className="rounded-full bg-[#c147e9] text-white hover:bg-[#b03fd4]"
                onClick={() => {
                  void (async () => {
                    setPushBusy(true);
                    setPushStatus(null);
                    try {
                      const res = await enableWebPush();
                      if (res.ok) {
                        setPushStatus("subscribed");
                        toast.success("Push enabled on this device");
                      } else {
                        setPushStatus(res.reason || "failed");
                        toast.error(
                          res.reason === "not_configured"
                            ? "Add VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY to enable push"
                            : res.reason === "denied"
                              ? "Notification permission denied"
                              : "Could not enable push",
                        );
                      }
                    } catch {
                      toast.error("Push setup failed");
                    } finally {
                      setPushBusy(false);
                    }
                  })();
                }}
              >
                {pushBusy ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-1.5 h-4 w-4" />
                )}
                Enable push
              </Button>
                          </div>
                        </div>

          <div className={cardShell}>
            <h3 className="mb-4 text-sm font-bold text-slate-900">Event types</h3>
            <div className="space-y-1">
              {Object.keys(EVENT_LABELS).map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-white/80"
                >
                  <label
                    htmlFor={`evt-${id}`}
                    className="min-w-0 cursor-pointer text-sm font-medium text-slate-700"
                  >
                    {EVENT_LABELS[id]}
                  </label>
                  <Switch
                    id={`evt-${id}`}
                    checked={Boolean(notifications.events?.[id])}
                    onCheckedChange={(v) =>
                      setNotifications((prev) => ({
                        ...prev,
                        events: { ...prev.events, [id]: v },
                      }))
                    }
                  />
                </div>
              ))}
                    </div>
                  </div>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="mt-3 space-y-4 sm:mt-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Security policy</h2>
            <p className="text-xs text-slate-500">
              Login hardening, session lifetime, and registration controls.
            </p>
                  </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                key: "require2faForAdmins" as const,
                label: "Require 2FA for admins",
                hint: "Enforce second factor for admin accounts",
                icon: ShieldCheck,
              },
              {
                key: "requireStrongPassword" as const,
                label: "Strong passwords",
                hint: "Require mixed case, number, symbol",
                icon: KeyRound,
              },
              {
                key: "allowSelfRegistration" as const,
                label: "Allow self-registration",
                hint: "Public signup for new students",
                icon: UserPlus,
                      },
                    ].map((item) => (
                      <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white p-4"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <item.icon className="h-4 w-4 text-emerald-600" />
                      </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.hint}</p>
                  </div>
                </div>
                <Switch
                  checked={security[item.key]}
                  onCheckedChange={(v) =>
                    setSecurity((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          <div className={cn(cardShell, "grid gap-4 sm:grid-cols-2")}>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                Session timeout (minutes)
              </label>
              <Input
                type="number"
                min={15}
                max={10080}
                value={security.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    sessionTimeoutMinutes: Number(e.target.value) || 15,
                  }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-slate-700">
                Max login attempts
              </label>
              <Input
                type="number"
                min={3}
                max={20}
                value={security.maxLoginAttempts}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    maxLoginAttempts: Number(e.target.value) || 3,
                  }))
                }
                className={fieldClass}
              />
              </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-slate-700">
                Lockout duration (minutes)
              </label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={security.lockoutMinutes}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    lockoutMinutes: Number(e.target.value) || 5,
                  }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-slate-700">
                Password min length
              </label>
              <Input
                type="number"
                min={6}
                max={64}
                value={security.passwordMinLength}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    passwordMinLength: Number(e.target.value) || 6,
                  }))
                }
                className={fieldClass}
              />
              </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 text-xs font-semibold text-slate-700">
                Force password reset every N days (0 = off)
              </label>
              <Input
                type="number"
                min={0}
                max={365}
                value={security.forcePasswordResetDays}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    forcePasswordResetDays: Number(e.target.value) || 0,
                  }))
                }
                className={fieldClass}
              />
            </div>
              </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
            <div className="flex gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] leading-relaxed text-amber-900/80">
                Security changes are audited. Session timeout and lockout rules
                apply to new sessions after save.
              </p>
            </div>
            </div>
          </TabsContent>
        </Tabs>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-11 w-full gap-1.5 bg-violet-600 text-sm text-white hover:bg-violet-700"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
