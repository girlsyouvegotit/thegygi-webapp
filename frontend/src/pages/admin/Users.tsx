import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  Search,
  Trash2,
  Ban,
  CheckCircle2,
  Loader2,
  Shield,
  GraduationCap,
  HeartHandshake,
  User,
  Crown,
  Check,
  UserCog,
  Mail,
  Phone,
  LayoutGrid,
  List,
  ArrowUpRight,
  Clock,
  FolderTree,
  X,
  UserPlus,
  Copy,
  Pen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { user, UserRole, adminOverview, category } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuthContext";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const ROLE_TABS: {
  role: UserRole;
  label: string;
  plural: string;
  icon: typeof User;
  accent: string;
  soft: string;
  ring: string;
  overviewKey: keyof Pick<
    adminOverview,
    | "totalStudents"
    | "totalTutors"
    | "totalMentors"
    | "totalWriters"
    | "totalAdmins"
  >;
}[] = [
  {
    role: "student",
    label: "Student",
    plural: "Students",
    icon: User,
    accent: "from-emerald-500 to-teal-500",
    soft: "bg-emerald-500/10 text-emerald-600",
    ring: "ring-emerald-500/30",
    overviewKey: "totalStudents",
  },
  {
    role: "tutor",
    label: "Tutor",
    plural: "Tutors",
    icon: GraduationCap,
    accent: "from-sky-500 to-blue-600",
    soft: "bg-sky-500/10 text-sky-600",
    ring: "ring-sky-500/30",
    overviewKey: "totalTutors",
  },
  {
    role: "mentor",
    label: "Mentor",
    plural: "Mentors",
    icon: HeartHandshake,
    accent: "from-amber-500 to-orange-500",
    soft: "bg-amber-500/10 text-amber-600",
    ring: "ring-amber-500/30",
    overviewKey: "totalMentors",
  },
  {
    role: "writer",
    label: "Writer",
    plural: "Writers",
    icon: Pen,
    accent: "from-violet-500 to-purple-600",
    soft: "bg-violet-500/10 text-violet-600",
    ring: "ring-violet-500/30",
    overviewKey: "totalWriters",
  },
  {
    role: "admin",
    label: "Admin",
    plural: "Admins",
    icon: Shield,
    accent: "from-primary to-fuchsia-500",
    soft: "bg-primary/10 text-primary",
    ring: "ring-primary/30",
    overviewKey: "totalAdmins",
  },
];

const isValidRole = (value: string | null): value is UserRole =>
  ROLE_TABS.some((tab) => tab.role === value);

const UserManagement = () => {
  const { user: authUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");

  const [users, setUsers] = useState<user[]>([]);
  const [overview, setOverview] = useState<adminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>(
    isValidRole(roleFromUrl) ? roleFromUrl : "student",
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [focusedUser, setFocusedUser] = useState<user | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [mentorCategoryOpen, setMentorCategoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<user | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("student");
  const [assigningRole, setAssigningRole] = useState(false);
  const [categories, setCategories] = useState<category[]>([]);
  const [mentorCategoryId, setMentorCategoryId] = useState("");
  const [mentorMaxMentees, setMentorMaxMentees] = useState(10);

  const [createWriterOpen, setCreateWriterOpen] = useState(false);
  const [creatingWriter, setCreatingWriter] = useState(false);
  const [writerForm, setWriterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [createdWriterCreds, setCreatedWriterCreds] = useState<{
    email: string;
    temporaryPassword: string;
    title?: string;
  } | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (isValidRole(roleFromUrl) && roleFromUrl !== activeRole) {
      setActiveRole(roleFromUrl);
    }
  }, [roleFromUrl, activeRole]);

  const setRole = (role: UserRole) => {
    setActiveRole(role);
    setFocusedUser(null);
    setSearchParams({ role });
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?role=${activeRole}&limit=200`);
      setUsers(
        (data.data?.users || data.users || []).filter(
          (u: user) => u.role !== "super_admin",
        ),
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  const fetchOverview = useCallback(async () => {
    try {
      const { data } = await api.get("/analytics/admin/overview");
      setOverview(data.data.overview as adminOverview);
    } catch {
      // Non-blocking — role cards fall back to current list length
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories((data.data?.categories as category[]) || []);
    } catch {
      // Non-blocking — mentor category modal will show empty
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleSuspend = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/suspend`);
      toast.success("User suspended");
      fetchUsers();
      fetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to suspend user"));
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/activate`);
      toast.success("User activated");
      fetchUsers();
      fetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to activate user"));
    }
  };

  const resetCreateWriter = () => {
    setWriterForm({ name: "", email: "", password: "" });
    setCreatedWriterCreds(null);
    setCreatingWriter(false);
  };

  const handleCreateWriter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (writerForm.name.trim().length < 2) {
      toast.error("Enter the writer's name");
      return;
    }
    if (!writerForm.email.trim()) {
      toast.error("Enter the writer's email");
      return;
    }
    setCreatingWriter(true);
    try {
      const { data } = await api.post("/users/writers", {
        name: writerForm.name.trim(),
        email: writerForm.email.trim(),
        ...(writerForm.password.trim().length >= 8
          ? { password: writerForm.password.trim() }
          : {}),
      });
      setCreatedWriterCreds({
        email: writerForm.email.trim().toLowerCase(),
        temporaryPassword: data.data.temporaryPassword,
        title: "Writer ready",
      });
      toast.success("Writer account created");
      if (activeRole !== "writer") setRole("writer");
      else {
        fetchUsers();
        fetchOverview();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create writer"));
    } finally {
      setCreatingWriter(false);
    }
  };

  const handleResetPassword = async (target: user) => {
    setResettingPassword(true);
    try {
      const { data } = await api.put(`/users/${target._id}/password`);
      setCreatedWriterCreds({
        email: data.data.email || target.email,
        temporaryPassword: data.data.temporaryPassword,
        title: "Password reset",
      });
      setCreateWriterOpen(true);
      toast.success("New temporary password generated");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("User deleted");
      setDeleteOpen(false);
      setDeleteId(null);
      if (focusedUser?._id === deleteId) setFocusedUser(null);
      fetchUsers();
      fetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    }
  };

  const mentorFlowCompletedRef = useRef(false);

  const resetRoleDialog = () => {
    mentorFlowCompletedRef.current = true;
    setRoleDialogOpen(false);
    setMentorCategoryOpen(false);
    setSelectedUser(null);
    setNewRole("student");
    setMentorCategoryId("");
    setMentorMaxMentees(10);
  };

  const submitRoleChange = async (payload: {
    role: UserRole;
    categoryId?: string;
    maxMentees?: number;
  }) => {
    if (!selectedUser) return;

    setAssigningRole(true);
    try {
      await api.put(`/users/${selectedUser._id}/role`, payload);
      toast.success(
        payload.role === "mentor" && payload.categoryId
          ? "Promoted to mentor and assigned to category"
          : `Role changed to ${payload.role}`,
      );
      if (focusedUser?._id === selectedUser._id) setFocusedUser(null);
      resetRoleDialog();
      fetchUsers();
      fetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to change role"));
    } finally {
      setAssigningRole(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;
    if (newRole === selectedUser.role) {
      setRoleDialogOpen(false);
      return;
    }

    // Promoting to mentor requires a category — open the category modal
    if (newRole === "mentor" && selectedUser.role !== "mentor") {
      setMentorCategoryId(categories[0]?._id || "");
      setMentorMaxMentees(10);
      setRoleDialogOpen(false);
      setMentorCategoryOpen(true);
      return;
    }

    await submitRoleChange({ role: newRole });
  };

  const handleSelectRoleOption = (role: UserRole) => {
    setNewRole(role);
    if (
      role === "mentor" &&
      selectedUser &&
      selectedUser.role !== "mentor"
    ) {
      mentorFlowCompletedRef.current = false;
      setMentorCategoryId(categories[0]?._id || "");
      setMentorMaxMentees(10);
      setRoleDialogOpen(false);
      setMentorCategoryOpen(true);
    }
  };

  const handleConfirmMentorCategory = async () => {
    if (!selectedUser) return;
    if (!mentorCategoryId) {
      toast.error("Select a category for this mentor");
      return;
    }
    await submitRoleChange({
      role: "mentor",
      categoryId: mentorCategoryId,
      maxMentees: mentorMaxMentees,
    });
  };

  const getRoleConfig = (role: UserRole) => {
    const tab = ROLE_TABS.find((t) => t.role === role);
    if (!tab) {
      return {
        label: role,
        icon: User,
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        soft: "bg-slate-500/10 text-slate-600",
        accent: "from-slate-400 to-slate-500",
      };
    }
    return {
      label: tab.label,
      icon: tab.icon,
      badgeClass: cn("border", tab.soft, "border-transparent"),
      soft: tab.soft,
      accent: tab.accent,
    };
  };

  const getRoleBadge = (role: UserRole) => {
    const config = getRoleConfig(role);
    const Icon = config.icon;
    return (
      <Badge
        className={cn(
          "text-[10px] font-semibold border gap-1 shrink-0 rounded-full px-2.5",
          config.badgeClass,
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeTab = ROLE_TABS.find((t) => t.role === activeRole)!;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? u.isActive
            : !u.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const activeCount = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;
  const totalPlatformUsers =
    (overview?.totalStudents || 0) +
    (overview?.totalTutors || 0) +
    (overview?.totalMentors || 0) +
    (overview?.totalWriters || 0) +
    (overview?.totalAdmins || 0);
  const firstName = authUser?.name?.trim().split(/\s+/)[0] || "Admin";
  const activeRate = users.length
    ? Math.round((activeCount / users.length) * 100)
    : 0;
  const gaugeR = 52;
  const gaugeC = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeC - (activeRate / 100) * gaugeC;
  const recentUsers = filteredUsers.slice(0, 5);

  const openRoleDialog = (u: user) => {
    mentorFlowCompletedRef.current = false;
    setSelectedUser(u);
    setNewRole(u.role);
    setMentorCategoryId("");
    setMentorMaxMentees(10);
    setMentorCategoryOpen(false);
    setRoleDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14">
            <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Users className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
          </div>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] min-w-0 overflow-x-hidden pb-8">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">
            Hi {firstName}, welcome to GYGI
          </p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-[#2D2D44] sm:text-2xl">
            User Management
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Manage roles and access —{" "}
            <span className="font-semibold text-primary">
              {filteredUsers.length} {activeTab.plural.toLowerCase()}
            </span>{" "}
            in view · {totalPlatformUsers || users.length} on platform
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0 sm:w-[280px] lg:w-[320px]">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name or email…"
              className="h-11 w-full rounded-full border-slate-200/80 bg-white pr-10 pl-10 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F7F6FB] text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={() => {
              resetCreateWriter();
              setCreateWriterOpen(true);
            }}
            className="h-11 rounded-full bg-primary px-4 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Create writer
          </Button>
        </div>
      </header>

      {/* Top metrics — 3 bento cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4">
        {[
          {
            label: "Total on platform",
            value: totalPlatformUsers || users.length,
            icon: Users,
            soft: "bg-[#f3e0fb] text-[#9b2ec4]",
            hint: "All roles",
          },
          {
            label: `${activeTab.plural} active`,
            value: activeCount,
            icon: CheckCircle2,
            soft: "bg-emerald-50 text-emerald-600",
            hint: "In current roster",
          },
          {
            label: "Suspended",
            value: suspendedCount,
            icon: Ban,
            soft: "bg-rose-50 text-rose-500",
            hint: activeTab.plural,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl",
                card.soft,
              )}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] font-medium text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#2D2D44] tabular-nums sm:text-3xl">
              {card.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Middle bento — featured + role breakdown */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:gap-4 lg:grid-cols-12">
        <section className="relative min-w-0 overflow-hidden rounded-[1.75rem] text-white shadow-xl shadow-primary/20 lg:col-span-7">
          <img
            src="/Banner.jpg"
            alt="GYGI community"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/groupies.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a0b3d]/92 via-[#4c1d6d]/82 to-[#c147e9]/65" />
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.3), transparent 40%)",
            }}
          />
          <div className="relative z-10 flex min-h-[220px] flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0 max-w-md">
              <p className="text-[11px] font-bold tracking-wider text-white/70 uppercase">
                People ops
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                {activeTab.plural} roster
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Change roles, suspend access, reset passwords, and keep GYGI
                communities healthy.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-10 rounded-full bg-white px-4 text-xs font-bold text-[#2D2D44] hover:bg-white/90"
                  onClick={() => {
                    const el = document.getElementById("user-roster");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Browse roster
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full border-white/40 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    resetCreateWriter();
                    setCreateWriterOpen(true);
                  }}
                >
                  <Pen className="mr-1.5 h-3.5 w-3.5" />
                  Add writer
                </Button>
              </div>
            </div>
            <div className="relative mx-auto flex h-36 w-44 shrink-0 items-center justify-center sm:mx-0">
              <div className="absolute inset-4 rotate-[-8deg] rounded-[1.35rem] bg-white/15 backdrop-blur-sm" />
              <div className="absolute inset-2 rotate-[6deg] rounded-[1.35rem] bg-[#2D2D44]/35 shadow-2xl" />
              <div className="relative z-10 flex h-full w-full flex-col justify-between rounded-[1.35rem] bg-white/95 p-4 text-[#2D2D44] shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e0fb] text-primary">
                    <activeTab.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    GYGI
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums">
                    {overview?.[activeTab.overviewKey] ?? users.length}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {activeTab.plural}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Role breakdown
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#2D2D44]">
                {totalPlatformUsers || users.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-full bg-[#F7F6FB] p-1">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.role}
                  type="button"
                  onClick={() => setRole(tab.role)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
                    activeRole === tab.role
                      ? "bg-[#2D2D44] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {ROLE_TABS.map((tab) => {
              const count = overview?.[tab.overviewKey] ?? 0;
              const pct = totalPlatformUsers
                ? Math.round((count / totalPlatformUsers) * 100)
                : 0;
              const Icon = tab.icon;
              return (
                <li key={tab.role}>
                  <button
                    type="button"
                    onClick={() => setRole(tab.role)}
                    className="group w-full text-left"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg",
                            tab.soft,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                        {tab.plural}
                      </span>
                      <span className="text-xs font-black tabular-nums text-[#2D2D44]">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F7F6FB]">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r transition-all",
                          tab.accent,
                          activeRole === tab.role
                            ? "opacity-100"
                            : "opacity-60 group-hover:opacity-90",
                        )}
                        style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Bottom bento — roster + health / focus */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        <div
          id="user-roster"
          className={cn(
            "min-w-0",
            focusedUser ? "xl:col-span-8" : "xl:col-span-8",
          )}
        >
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-[#2D2D44]">
                  {activeTab.plural}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tap a person to open their profile panel
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { key: "all", label: "All", count: users.length },
                      { key: "active", label: "Active", count: activeCount },
                      {
                        key: "suspended",
                        label: "Suspended",
                        count: suspendedCount,
                      },
                    ] as const
                  ).map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStatusFilter(chip.key)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                        statusFilter === chip.key
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "border border-slate-200 bg-[#F7F6FB] text-slate-500 hover:border-slate-300",
                      )}
                    >
                      {chip.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                          statusFilter === chip.key
                            ? "bg-white/20"
                            : "bg-white text-slate-500",
                        )}
                      >
                        {chip.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="inline-flex items-center rounded-full border border-slate-200/80 bg-[#F7F6FB] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      viewMode === "list"
                        ? "bg-[#2D2D44] text-white"
                        : "text-slate-400 hover:text-slate-700",
                    )}
                    aria-label="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      viewMode === "grid"
                        ? "bg-[#2D2D44] text-white"
                        : "text-slate-400 hover:text-slate-700",
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No users found"
                  description={
                    search
                      ? `No results for "${search}"`
                      : statusFilter !== "all"
                        ? `No ${statusFilter} ${activeTab.plural.toLowerCase()}`
                        : `No ${activeTab.plural.toLowerCase()} found`
                  }
                  icon={<Users className="h-8 w-8 text-slate-300" />}
                />
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredUsers.map((u) => {
                  const roleConfig = getRoleConfig(u.role);
                  const isFocused = focusedUser?._id === u._id;
                  return (
                    <article
                      key={u._id}
                      className={cn(
                        "group relative min-w-0 cursor-pointer rounded-[1.35rem] border bg-[#FAFAFC] p-4 transition-all duration-300",
                        isFocused
                          ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                          : "border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-md",
                      )}
                      onClick={() => setFocusedUser(isFocused ? null : u)}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-md ring-1 ring-slate-100">
                            <AvatarImage src={u.avatar} alt={u.name} />
                            <AvatarFallback
                              className={cn("text-sm font-bold", roleConfig.soft)}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white",
                              u.isActive ? "bg-emerald-500" : "bg-rose-400",
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {u.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </p>
                        </div>
                      </div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {getRoleBadge(u.role)}
                        <Badge
                          className={cn(
                            "gap-1 rounded-full border text-[10px] font-semibold",
                            u.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700",
                          )}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                      <div
                        className="flex items-center gap-2 border-t border-slate-100 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 gap-1.5 rounded-full border-slate-200 bg-white text-xs font-semibold hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          onClick={() => openRoleDialog(u)}
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full hover:bg-amber-50"
                          onClick={() =>
                            u.isActive
                              ? handleSuspend(u._id)
                              : handleActivate(u._id)
                          }
                          title={u.isActive ? "Suspend user" : "Activate user"}
                        >
                          {u.isActive ? (
                            <Ban className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full hover:bg-rose-50"
                          onClick={() => openDelete(u._id)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const roleConfig = getRoleConfig(u.role);
                  const isFocused = focusedUser?._id === u._id;
                  return (
                    <li
                      key={u._id}
                      className={cn(
                        "flex min-w-0 cursor-pointer flex-col gap-3 py-3.5 transition-colors first:pt-0 last:pb-0 sm:flex-row sm:items-center",
                        isFocused ? "opacity-100" : "hover:opacity-95",
                      )}
                      onClick={() => setFocusedUser(isFocused ? null : u)}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11 border border-slate-100 shadow-sm">
                            <AvatarImage src={u.avatar} alt={u.name} />
                            <AvatarFallback
                              className={cn("text-xs font-bold", roleConfig.soft)}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white",
                              u.isActive ? "bg-emerald-500" : "bg-rose-400",
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#2D2D44]">
                            {u.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {u.lastLoginAt
                              ? `Last login ${formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })}`
                              : u.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            u.isActive ? "text-emerald-600" : "text-rose-500",
                          )}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => openRoleDialog(u)}
                          >
                            <UserCog className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() =>
                              u.isActive
                                ? handleSuspend(u._id)
                                : handleActivate(u._id)
                            }
                          >
                            {u.isActive ? (
                              <Ban className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => openDelete(u._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          {focusedUser ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-lg xl:sticky xl:top-4">
              <div
                className={cn(
                  "relative h-28 bg-gradient-to-br",
                  getRoleConfig(focusedUser.role).accent,
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.25),transparent_55%)]" />
                <button
                  type="button"
                  onClick={() => setFocusedUser(null)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/30"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative z-10 -mt-10 px-5 pb-5">
                <Avatar className="mx-auto h-20 w-20 border-4 border-white shadow-xl sm:mx-0">
                  <AvatarImage
                    src={focusedUser.avatar}
                    alt={focusedUser.name}
                  />
                  <AvatarFallback
                    className={cn(
                      "text-xl font-black",
                      getRoleConfig(focusedUser.role).soft,
                    )}
                  >
                    {getInitials(focusedUser.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="mt-3 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-lg font-black text-slate-900">
                      {focusedUser.name}
                    </h2>
                    {focusedUser.role === "admin" ? (
                      <Crown className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500 sm:justify-start">
                    <Mail className="h-3 w-3" />
                    {focusedUser.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {getRoleBadge(focusedUser.role)}
                    <Badge
                      className={cn(
                        "gap-1 rounded-full border text-[10px] font-semibold",
                        focusedUser.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700",
                      )}
                    >
                      {focusedUser.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#F7F5FB] p-3">
                    <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                      Joined
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-800">
                      {focusedUser.createdAt
                        ? format(new Date(focusedUser.createdAt), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F7F5FB] p-3">
                    <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                      Last login
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-800">
                      {focusedUser.lastLoginAt
                        ? formatDistanceToNow(
                            new Date(focusedUser.lastLoginAt),
                            { addSuffix: true },
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                {focusedUser.phone ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F7F5FB] px-3 py-2.5 text-xs text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {focusedUser.phone}
                  </div>
                ) : null}

                {focusedUser.bio ? (
                  <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-slate-500">
                    {focusedUser.bio}
                  </p>
                ) : null}

                {(focusedUser.categories?.length ||
                  focusedUser.assignedCategories?.length) ? (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        focusedUser.categories ||
                        focusedUser.assignedCategories ||
                        []
                      ).map((c) => (
                        <span
                          key={c._id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary"
                        >
                          <FolderTree className="h-3 w-3" />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 space-y-2">
                  <Button
                    className="h-10 w-full gap-2 rounded-full bg-primary font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90"
                    onClick={() => openRoleDialog(focusedUser)}
                  >
                    <UserCog className="h-4 w-4" />
                    Change Role
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full gap-1.5 rounded-full border-slate-200 font-semibold"
                    disabled={resettingPassword}
                    onClick={() => void handleResetPassword(focusedUser)}
                  >
                    {resettingPassword ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-violet-600" />
                    )}
                    Reset password
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-10 gap-1.5 rounded-full border-slate-200 font-semibold"
                      onClick={() =>
                        focusedUser.isActive
                          ? handleSuspend(focusedUser._id)
                          : handleActivate(focusedUser._id)
                      }
                    >
                      {focusedUser.isActive ? (
                        <>
                          <Ban className="h-3.5 w-3.5 text-amber-500" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 gap-1.5 rounded-full border-rose-200 font-semibold text-rose-600 hover:bg-rose-50"
                      onClick={() => openDelete(focusedUser._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  Profile snapshot · GYGI ops
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#2D2D44] p-5 text-white shadow-xl sm:p-6">
                <div className="pointer-events-none absolute -right-6 -bottom-8 h-28 w-28 rounded-[1.5rem] bg-primary/30 blur-xl" />
                <div className="pointer-events-none absolute right-4 top-10 h-20 w-20 rotate-12 rounded-[1.25rem] bg-white/5" />
                <p className="text-[11px] font-bold tracking-wider text-white/60 uppercase">
                  {activeTab.plural} health
                </p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  Active accounts in this roster
                </p>
                <div className="relative mx-auto mt-5 flex h-36 w-36 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r={gaugeR}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={gaugeR}
                      fill="none"
                      stroke="#c147e9"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={gaugeC}
                      strokeDashoffset={gaugeOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tabular-nums">
                      {activeRate}%
                    </span>
                    <span className="text-[10px] font-bold text-white/50 uppercase">
                      Active
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-white/55">
                  {activeCount} active · {suspendedCount} suspended
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2D2D44]">
                    Recent in view
                  </h3>

                </div>
                {recentUsers.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No users to preview
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentUsers.map((u) => (
                      <li key={u._id}>
                        <button
                          type="button"
                          onClick={() => setFocusedUser(u)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <Avatar className="h-9 w-9 border border-slate-100">
                            <AvatarImage src={u.avatar} alt={u.name} />
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-bold",
                                getRoleConfig(u.role).soft,
                              )}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#2D2D44]">
                              {u.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {u.email}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-xs font-bold",
                              u.isActive ? "text-emerald-600" : "text-rose-500",
                            )}
                          >
                            {u.isActive ? "Active" : "Off"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Role change modal */}
      <Dialog
        open={roleDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetRoleDialog();
          else setRoleDialogOpen(true);
        }}
      >
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-5 sm:p-6 rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserCog className="w-4 h-4 text-primary" />
              </div>
              Change User Role
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Assign a new role to this user on GYGI. Choosing Mentor asks which
              category to assign them to.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F7F5FB] border border-slate-100">
                <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                  <AvatarImage
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedUser.email}
                  </p>
                </div>
                {getRoleBadge(selectedUser.role)}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select New Role
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {ROLE_TABS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = newRole === option.role;
                    const isCurrentRole = selectedUser.role === option.role;

                    return (
                      <button
                        key={option.role}
                        type="button"
                        onClick={() => handleSelectRoleOption(option.role)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            isSelected ? option.soft : "bg-slate-100",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              isSelected
                                ? option.soft.split(" ")[1]
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              isSelected ? "text-slate-900" : "text-slate-600",
                            )}
                          >
                            {option.label}
                          </p>
                          {isCurrentRole && (
                            <p className="text-[10px] text-primary font-medium mt-0.5">
                              Current role
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-full bg-white border-slate-200"
                  onClick={resetRoleDialog}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  onClick={() => void handleAssignRole()}
                  disabled={assigningRole || newRole === selectedUser.role}
                >
                  {assigningRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : newRole === selectedUser.role ? (
                    "Already This Role"
                  ) : newRole === "mentor" ? (
                    "Continue"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mentor category picker — shown when promoting to mentor */}
      <Dialog
        open={mentorCategoryOpen}
        onOpenChange={(open) => {
          setMentorCategoryOpen(open);
          if (!open && selectedUser && !mentorFlowCompletedRef.current) {
            // Dismissed without confirming — return to role picker
            setNewRole(selectedUser.role);
            setRoleDialogOpen(true);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-5 sm:p-6 rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <HeartHandshake className="h-4 w-4 text-amber-600" />
              </div>
              Assign mentor category
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedUser
                ? `Which category should ${selectedUser.name} mentor?`
                : "Select a category for this mentor."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={mentorCategoryId}
                onChange={(e) => setMentorCategoryId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-[#F7F5FB] px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[11px] text-amber-600">
                  No categories found. Create a category first.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Max mentees
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={mentorMaxMentees}
                onChange={(e) =>
                  setMentorMaxMentees(
                    Math.min(50, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                className="h-11 rounded-2xl bg-[#F7F5FB]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-full"
                onClick={() => {
                  setMentorCategoryOpen(false);
                  setNewRole(selectedUser?.role || "student");
                  setRoleDialogOpen(true);
                }}
              >
                Back
              </Button>
              <Button
                className="h-10 flex-1 rounded-full"
                disabled={assigningRole || !mentorCategoryId}
                onClick={() => void handleConfirmMentorCategory()}
              >
                {assigningRole ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Promote & assign"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm p-5 sm:p-6 rounded-[1.5rem]">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-black">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              This action cannot be undone. The user will be permanently removed
              from the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-full bg-white border-slate-200"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-full"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create writer — no category / enrollment */}
      <Dialog
        open={createWriterOpen}
        onOpenChange={(open) => {
          setCreateWriterOpen(open);
          if (!open) resetCreateWriter();
        }}
      >
        <DialogContent className="w-[calc(100vw-24px)] max-w-md rounded-[1.5rem] p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <Pen className="h-4 w-4 text-violet-600" />
              </div>
              Create writer
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Creates a writer account with no learning category. They can sign
              in and go straight to the Writer portal.
            </DialogDescription>
          </DialogHeader>

          {createdWriterCreds ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-sm font-bold text-emerald-800">
                  {createdWriterCreds.title || "Credentials ready"}
                </p>
                <p className="mt-1 text-xs text-emerald-700/90">
                  Share these credentials securely. The password is shown once.
                </p>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-[#F7F5FB] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {createdWriterCreds.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        createdWriterCreds.email,
                      );
                      toast.success("Email copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Temporary password
                    </p>
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {createdWriterCreds.temporaryPassword}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        createdWriterCreds.temporaryPassword,
                      );
                      toast.success("Password copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                className="h-10 w-full rounded-full"
                onClick={() => {
                  setCreateWriterOpen(false);
                  resetCreateWriter();
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleCreateWriter(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Full name
                </label>
                <Input
                  value={writerForm.name}
                  onChange={(e) =>
                    setWriterForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ada Writer"
                  className="h-11 rounded-2xl bg-[#F7F5FB]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email
                </label>
                <Input
                  type="email"
                  value={writerForm.email}
                  onChange={(e) =>
                    setWriterForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="writer@example.com"
                  className="h-11 rounded-2xl bg-[#F7F5FB]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Password (optional)
                </label>
                <Input
                  type="text"
                  value={writerForm.password}
                  onChange={(e) =>
                    setWriterForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Leave blank to auto-generate"
                  className="h-11 rounded-2xl bg-[#F7F5FB]"
                  minLength={8}
                />
                <p className="text-[11px] text-slate-400">
                  Min 8 characters if set. Otherwise we generate a temporary
                  password for you to share.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1 rounded-full"
                  onClick={() => {
                    setCreateWriterOpen(false);
                    resetCreateWriter();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 flex-1 rounded-full"
                  disabled={creatingWriter}
                >
                  {creatingWriter ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create writer
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
