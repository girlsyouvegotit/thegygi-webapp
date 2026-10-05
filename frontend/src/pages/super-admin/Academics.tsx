import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  saMainGrid,
  saSpan4,
  saSpan6,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  SaSoftButton,
  saPrimaryBtn,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type AcademicsHub = {
  enrollmentStats: {
    byStatus: Record<string, number>;
    topCategories: Array<{ name?: string; count: number }>;
  };
  academicYears: Array<{
    _id: string;
    name: string;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
  }>;
  certificates: {
    recent: Array<{
      _id: string;
      certificateNumber?: string;
      status: string;
      studentFullName?: string;
      categoryName?: string;
      student?: { name?: string };
      category?: { name?: string };
    }>;
    revokedCount: number;
  };
  quizAnomalies: Array<{
    _id: string;
    percentage: number;
    attempt: number;
    student?: { name?: string };
  }>;
  assignmentLate: Array<{
    _id: string;
    submittedAt?: string;
    student?: { name?: string };
    assignment?: { title?: string };
  }>;
};

export default function AcademicsPage() {
  const { data, loading, error, reload } = useSaHub<AcademicsHub>(
    "/super-admin/academics",
    "Failed to load academics hub",
  );

  const activateYear = async (id: string) => {
    try {
      await api.post(`/super-admin/academics/years/${id}/activate`);
      toast.success("Academic year activated");
      void reload();
    } catch {
      toast.error("Could not activate year");
    }
  };

  const revokeCert = async (id: string) => {
    try {
      await api.post(`/super-admin/certificates/${id}/revoke`);
      toast.success("Certificate revoked");
      void reload();
    } catch {
      toast.error("Revoke failed");
    }
  };

  const enrollmentTotal = Object.values(
    data?.enrollmentStats?.byStatus || {},
  ).reduce((a, b) => a + b, 0);
  const activeYear = data?.academicYears?.find((y) => y.isActive);

  return (
    <SaHubShell
      title="Academics control"
      subtitle="Enrollments, years, certificates, quiz & assignment risk (F14–F18)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Enrollment census"
              rows={[
                {
                  label: "Total enrollments",
                  value: enrollmentTotal,
                  color: "#c147e9",
                },
                {
                  label: "Revoked certificates",
                  value: data.certificates?.revokedCount || 0,
                  color: "#f43f5e",
                },
                {
                  label: "Quiz anomalies",
                  value: data.quizAnomalies?.length || 0,
                  color: "#FF9F43",
                },
                {
                  label: "Late assignments",
                  value: data.assignmentLate?.length || 0,
                  color: "#5B5FEF",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <SaRingCard
              title="Issued vs recent"
              subtitle="Recent cert queue"
              percent={
                data.certificates?.recent?.length
                  ? Math.min(
                      100,
                      (data.certificates.recent.filter((c) => c.status === "issued")
                        .length /
                        data.certificates.recent.length) *
                        100,
                    )
                  : 0
              }
              tone="green"
            />
            <StatPill
              label="Active year"
              value={activeYear?.name || "None"}
              hint="F15 roll-forward"
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-5 sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2 xl:grid-cols-1 xl:[&>:last-child:nth-child(odd)]:col-span-1")}>
            {Object.entries(data.enrollmentStats?.byStatus || {}).map(([k, v]) => (
              <StatPill key={k} label={k} value={v} />
            ))}
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Academic years" hint="F15 roll-forward">
              <ul className="space-y-4">
                {(data.academicYears || []).map((y) => (
                  <li
                    key={y._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                  >
                    <div>
                      <p className="font-bold text-foreground">{y.name}</p>
                      {y.isActive ? (
                        <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                    {!y.isActive ? (
                      <button
                        type="button"
                        className={saPrimaryBtn}
                        onClick={() => void activateYear(y._id)}
                      >
                        Activate
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Top categories by enrollment" hint="F14">
              {(data.enrollmentStats?.topCategories || []).length ? (
                <ul className="space-y-4">
                  {(data.enrollmentStats?.topCategories || []).map((c, i) => (
                    <li
                      key={`${c.name}-${i}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3.5 text-sm ring-1 ring-border"
                    >
                      <span className="min-w-0 truncate font-bold text-foreground">
                        {c.name}
                      </span>
                      <span className="shrink-0 font-black tabular-nums">
                        {c.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[160px] items-center justify-center rounded-2xl bg-muted px-6 py-10 text-center ring-1 ring-border">
                  <p className="text-sm text-muted-foreground">No category enrollments yet</p>
                </div>
              )}
            </SaSection>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Certificates" hint="F16">
              <ul className="max-h-96 space-y-3 overflow-y-auto">
                {(data.certificates?.recent || []).map((c) => (
                  <SaEntityCard
                    key={c._id}
                    title={c.studentFullName || c.student?.name || "Student"}
                    tags={[
                      {
                        label: c.status,
                        tone:
                          c.status === "issued"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-muted text-muted-foreground",
                      },
                    ]}
                    meta={c.categoryName || c.category?.name}
                    actions={
                      c.status === "issued" ? (
                        <SaSoftButton
                          tone="danger"
                          onClick={() => void revokeCert(c._id)}
                        >
                          Revoke
                        </SaSoftButton>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Quiz anomalies" hint="F17">
              <ul className="max-h-96 space-y-3 overflow-y-auto">
                {(data.quizAnomalies || []).map((q) => (
                  <SaEntityCard
                    key={q._id}
                    title={q.student?.name || "Student"}
                    tags={[
                      {
                        label: `${q.percentage}%`,
                        tone: "bg-amber-50 text-amber-800",
                      },
                      {
                        label: `attempt ${q.attempt}`,
                        tone: "bg-muted text-muted-foreground",
                      },
                    ]}
                  />
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Late assignment spikes" hint="F18">
              <ul className="max-h-96 space-y-3 overflow-y-auto">
                {(data.assignmentLate || []).map((a) => (
                  <SaEntityCard
                    key={a._id}
                    title={a.student?.name || "Student"}
                    meta={a.assignment?.title || "Assignment"}
                    tags={[
                      {
                        label: "late",
                        tone: "bg-rose-50 text-rose-700",
                      },
                    ]}
                  />
                ))}
              </ul>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
