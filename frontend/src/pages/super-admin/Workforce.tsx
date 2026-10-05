import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  saInput,
  saMainGrid,
  saPrimaryBtn,
  saSpan4,
  saSpan5,
  saSpan6,
  saSpan7,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type WorkforceHub = {
  fillRates: Array<{
    _id: string;
    title?: string;
    maxParticipants?: number;
    attendanceCount?: number;
    fillRate?: number | null;
  }>;
  tutorUtilization: Array<{
    _id?: string;
    tutorId?: string;
    name?: string;
    classCount?: number;
    classes?: number;
  }>;
  noShowRisk: Array<{
    _id?: string;
    studentId?: string;
    name?: string;
    absences?: number;
    count?: number;
  }>;
  scheduleConflicts: Array<{
    tutorId: string;
    tutor?: { name?: string };
    name?: string;
  }>;
  mentorshipLoad: Array<{
    mentorId: string;
    name?: string;
    menteeCount?: number;
    mentees?: number;
  }>;
};

export default function WorkforcePage() {
  const { data, loading, error, reload } = useSaHub<WorkforceHub>(
    "/super-admin/workforce",
    "Failed to load workforce hub",
  );
  const [assignmentId, setAssignmentId] = useState("");
  const [mentorId, setMentorId] = useState("");

  const reassign = async () => {
    if (!assignmentId || !mentorId) {
      toast.error("Assignment ID and new mentor ID required");
      return;
    }
    try {
      await api.post("/super-admin/mentorship/reassign", {
        assignmentId,
        mentorId,
      });
      toast.success("Mentee reassigned");
      setAssignmentId("");
      setMentorId("");
      void reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Reassign failed");
    }
  };

  const fillWithRate = data?.fillRates?.filter((c) => c.fillRate != null) ?? [];
  const avgFill = fillWithRate.length
    ? Math.round(
        fillWithRate.reduce((a, c) => a + (c.fillRate ?? 0), 0) /
          fillWithRate.length,
      )
    : 0;
  const topTutor = data?.tutorUtilization?.[0];
  const topTutorClasses =
    topTutor?.classCount ?? topTutor?.classes ?? 0;

  return (
    <SaHubShell
      title="Workforce ops"
      subtitle="Fill rates, tutor load, no-shows, conflicts, mentorship balance (F23–F26, F37–F38)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Ops overview"
              rows={[
                {
                  label: "Fill samples",
                  value: data.fillRates?.length || 0,
                  color: "#c147e9",
                },
                {
                  label: "Tutors tracked",
                  value: data.tutorUtilization?.length || 0,
                  color: "#5B5FEF",
                },
                {
                  label: "Schedule conflicts",
                  value: data.scheduleConflicts?.length || 0,
                  color: "#f43f5e",
                },
                {
                  label: "Mentors loaded",
                  value: data.mentorshipLoad?.length || 0,
                  color: "#22c55e",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-4")}>
            <SaRingCard
              title="Avg class fill"
              subtitle="Across sampled classes"
              percent={avgFill || 0}
              tone="primary"
            />
            <SaRingCard
              title="No-show watchlist"
              subtitle="Students flagged"
              percent={Math.min(
                100,
                (data.noShowRisk?.length || 0) * 8,
              )}
              tone="orange"
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-4")}>
            <StatPill
              label="Top tutor (30d)"
              value={topTutorClasses}
              hint={topTutor?.name || "—"}
            />
            <StatPill
              label="No-show risk"
              value={data.noShowRisk?.length || 0}
              hint="F25"
            />
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Class fill rates" hint="F23">
              <ul className="max-h-80 space-y-3 overflow-y-auto">
                {(data.fillRates || []).map((c) => (
                  <li
                    key={c._id}
                    className="rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-bold text-foreground">
                        {c.title}
                      </span>
                      <span className="font-black tabular-nums">
                        {c.fillRate == null ? "—" : `${c.fillRate}%`}
                      </span>
                    </div>
                    {c.fillRate != null ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#c147e9]"
                          style={{ width: `${Math.min(100, c.fillRate)}%` }}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Tutor utilization (30d)" hint="F24">
              <ul className="max-h-80 space-y-3 overflow-y-auto">
                {(data.tutorUtilization || []).map((t, i) => (
                  <li
                    key={t.tutorId || t._id || i}
                    className="flex justify-between rounded-2xl bg-muted px-4 py-3.5 text-sm ring-1 ring-border"
                  >
                    <span className="font-bold text-foreground">
                      {t.name || "Tutor"}
                    </span>
                    <span className="font-black tabular-nums">
                      {t.classCount ?? t.classes ?? 0} classes
                    </span>
                  </li>
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan5, "h-full")}>
            <SaSection title="No-show risk" hint="F25">
              <div className="grid gap-4 sm:grid-cols-2">
                {(data.noShowRisk || []).map((s, i) => (
                  <SaEntityCard
                    key={s.studentId || s._id || i}
                    title={s.name || "Student"}
                    tags={[
                      {
                        label: `${s.absences ?? s.count ?? 0} absences`,
                        tone: "bg-amber-50 text-amber-800",
                      },
                    ]}
                  />
                ))}
              </div>
              {!data.noShowRisk?.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No elevated absence patterns
                </p>
              ) : null}
            </SaSection>
          </div>

          <div className={cn(saSpan7, "h-full")}>
            <SaSection title="Schedule conflicts" hint="F26">
              <ul className="space-y-4">
                {(data.scheduleConflicts || []).map((c, i) => (
                  <li
                    key={`${c.tutorId}-${i}`}
                    className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 text-sm ring-1 ring-rose-100/80"
                  >
                    <span className="font-bold text-foreground">
                      {c.tutor?.name || c.name || c.tutorId}
                    </span>
                    <SaSoftButton tone="danger">overlap</SaSoftButton>
                  </li>
                ))}
                {!data.scheduleConflicts?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No overlapping schedules
                  </p>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Mentorship load" hint="F37">
              <ul className="max-h-64 space-y-3 overflow-y-auto">
                {(data.mentorshipLoad || []).map((m) => {
                  const count = m.menteeCount ?? m.mentees ?? 0;
                  return (
                    <li
                      key={m.mentorId}
                      className="rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-foreground">{m.name}</span>
                        <span className="font-black">{count} mentees</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#5B5FEF]"
                          style={{
                            width: `${Math.min(100, (count / 10) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Reassign mentee" hint="F38">
              <div className="space-y-4">
                <input
                  value={assignmentId}
                  onChange={(e) => setAssignmentId(e.target.value)}
                  placeholder="Mentor assignment ID"
                  className={saInput}
                />
                <input
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  placeholder="New mentor user ID"
                  className={saInput}
                />
                <button type="button" className={saPrimaryBtn} onClick={() => void reassign()}>
                  Reassign mentee
                </button>
              </div>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
