import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Download, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skel } from "@/components/loading/PageSkeleton";
import {
  saCard,
  saCardTight,
  saInput,
  saMainGrid,
  saPageShell,
  saSpan12,
  SaPageHeader,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";

type Person = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  lastLoginAt?: string;
};

const PeoplePage = () => {
  const navigate = useNavigate();
  const { beginImpersonation } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("student");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/super-admin/people", {
        params: { q, role: role || undefined, page, limit: 20 },
      });
      setItems((data.data.items as Person[]) || []);
      setPages(data.data.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load people");
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const exportCsv = async () => {
    try {
      const { data } = await api.get("/super-admin/people/export", {
        params: { q, role: role || undefined },
      });
      const csv = data.data?.csv || data.csv;
      if (!csv) {
        toast.error("No export data");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.data?.filename || "people-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const bulkActive = async (isActive: boolean) => {
    if (!selected.length) {
      toast.error("Select people first");
      return;
    }
    try {
      await api.post("/super-admin/people/bulk-active", {
        userIds: selected,
        isActive,
      });
      toast.success(isActive ? "Activated" : "Deactivated");
      setSelected([]);
      void load();
    } catch {
      toast.error("Bulk update failed");
    }
  };

  const bulkChangeRole = async () => {
    if (!selected.length) {
      toast.error("Select people first");
      return;
    }
    try {
      await api.post("/super-admin/people/bulk-role", {
        userIds: selected,
        role: bulkRole,
      });
      toast.success("Roles updated");
      setSelected([]);
      void load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Bulk role failed");
    }
  };

  const impersonate = async (id: string) => {
    try {
      const home = await beginImpersonation(id);
      toast.success("Now viewing and acting as this user");
      navigate(home);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "View as failed");
    }
  };

  const activeCount = items.filter((p) => p.isActive).length;

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="GYGI Super Admin"
        title="People intelligence"
        subtitle="Search, dossier, silent View as (no user consent, hidden from dashboards), CSV & bulk actions."
        actions={
          <SaSoftButton tone="primary" onClick={() => void exportCsv()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </SaSoftButton>
        }
      />

      <div className={saMainGrid}>
        <div className={cn(saSpan12, "grid h-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-5")}>
          <StatPill label="This page" value={items.length} />
          <StatPill label="Active (page)" value={activeCount} valueClassName="text-emerald-600" />
          <StatPill label="Selected" value={selected.length} valueClassName="text-primary" />
          <StatPill label="Page" value={`${page} / ${pages}`} />
        </div>

        <section className={cn(saCard, saSpan12, "h-full")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search name, email, phone…"
                className={cn(saInput, "pl-10")}
              />
            </div>
            <select
              value={role}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value);
              }}
              className={cn(saInput, "w-full lg:max-w-[200px]")}
            >
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="mentor">Mentor</option>
              <option value="writer">Writer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <SaSoftButton onClick={() => void bulkActive(true)}>Activate selected</SaSoftButton>
            <SaSoftButton tone="warn" onClick={() => void bulkActive(false)}>
              Deactivate selected
            </SaSoftButton>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className={cn(saInput, "h-8 w-auto max-w-[140px] text-xs font-bold")}
            >
              <option value="student">student</option>
              <option value="tutor">tutor</option>
              <option value="mentor">mentor</option>
              <option value="writer">writer</option>
              <option value="admin">admin</option>
            </select>
            <SaSoftButton tone="primary" onClick={() => void bulkChangeRole()}>
              Apply role to selected
            </SaSoftButton>
          </div>
        </section>

        <div className={cn(saSpan12, "h-full")}>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn(saCardTight, "space-y-3")}>
                  <div className="flex items-center gap-4">
                    <Skel className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skel className="h-4 w-32" />
                      <Skel className="h-3 w-48" />
                    </div>
                  </div>
                  <Skel className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2">
              {items.map((p) => (
                <div key={p._id} className={cn(saCardTight, "relative h-full")}>
                  <label className="absolute top-4 right-4 flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="h-4 w-4 rounded border-border text-[#c147e9]"
                    />
                  </label>
                  <button
                    type="button"
                    className="flex w-full items-start gap-4 text-left"
                    onClick={() => navigate(`/super-admin/people/${p._id}`)}
                  >
                    <Avatar className="h-11 w-11 ring-2 ring-white">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="font-bold">
                        {p.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 pr-8">
                      <p className="truncate text-lg font-black text-foreground">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary capitalize">
                          {p.role}
                        </span>
                        {!p.isActive ? (
                          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            Inactive
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SaSoftButton
                      onClick={() => navigate(`/super-admin/people/${p._id}`)}
                    >
                      Dossier
                    </SaSoftButton>
                    {p.role !== "super_admin" ? (
                      <SaSoftButton
                        tone="primary"
                        onClick={() => void impersonate(p._id)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View as
                      </SaSoftButton>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={saCard}>
              <p className="py-12 text-center text-sm text-muted-foreground">
                No people match
              </p>
            </div>
          )}
        </div>

        <div className={cn(saSpan12, "h-full flex flex-wrap items-center justify-between gap-4")}>
          <SaSoftButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </SaSoftButton>
          <span className="text-sm font-semibold text-muted-foreground">
            Page {page} / {pages}
          </span>
          <SaSoftButton disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </SaSoftButton>
        </div>
      </div>
    </div>
  );
};

export default PeoplePage;
