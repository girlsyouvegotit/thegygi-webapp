import {
  saMainGrid,
  saSpan12,
  saSpan4,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type MentorshipGraph = {
  nodes: Array<{ id: string; kind: string; name: string; email?: string }>;
  edges: Array<{ from: string; to: string; category?: string }>;
  load: Array<{
    mentorId: string;
    mentorName: string;
    menteeCount: number;
    categories?: string[];
  }>;
  summary?: {
    mentors: number;
    mentees: number;
    links: number;
  };
};

const MentorshipPage = () => {
  const { data: graph, loading, error, reload } = useSaHub<MentorshipGraph>(
    "/super-admin/mentorship",
    "Failed to load mentorship graph",
  );

  const mentors =
    graph?.summary?.mentors ??
    graph?.nodes.filter((n) => n.kind === "mentor").length ??
    0;
  const mentees =
    graph?.summary?.mentees ??
    graph?.nodes.filter((n) => n.kind === "mentee").length ??
    0;
  const links = graph?.summary?.links ?? graph?.edges.length ?? 0;
  const maxLoad = Math.max(
    1,
    ...(graph?.load || []).map((m) => m.menteeCount),
  );
  const avgLoad =
    graph?.load?.length && mentors
      ? Math.round(
          graph.load.reduce((a, m) => a + m.menteeCount, 0) / mentors,
        )
      : 0;

  return (
    <SaHubShell
      title="Mentorship graph"
      subtitle={`${mentors} mentors · ${mentees} mentees · ${links} links — Category.mentors + assignments (F37).`}
      loading={loading && !graph}
      error={error}
      onRetry={reload}
    >
      {graph ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Network summary"
              rows={[
                { label: "Mentors", value: mentors, color: "#c147e9" },
                { label: "Mentees", value: mentees, color: "#5B5FEF" },
                { label: "Active links", value: links, color: "#22c55e" },
                {
                  label: "Avg load / mentor",
                  value: avgLoad,
                  color: "#FF9F43",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <SaRingCard
              title="Link density"
              subtitle="Links per mentor (cap 10)"
              percent={mentors > 0 ? Math.min(100, (links / mentors / 10) * 100) : 0}
              tone="primary"
            />
            <SaRingCard
              title="Mentee coverage"
              subtitle="Mentees vs links"
              percent={
                mentees > 0 ? Math.min(100, (links / mentees) * 100) : 0
              }
              tone="blue"
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <StatPill label="Mentors in load table" value={graph.load.length} />
            <StatPill
              label="Heaviest load"
              value={maxLoad > 1 ? maxLoad : graph.load[0]?.menteeCount ?? 0}
              hint="Mentees on top mentor"
            />
          </div>

          <div className={cn(saSpan12, "h-full")}>
            <SaSection
              title="Mentor load"
              hint="Sorted by mentee count — from assignments & category pools"
            >
              {graph.load.length ? (
                <div className="grid gap-5 sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2">
                  {graph.load.map((m) => {
                    const pct = Math.min(100, (m.menteeCount / 10) * 100);
                    return (
                      <SaEntityCard
                        key={m.mentorId}
                        title={m.mentorName}
                        tags={[
                          {
                            label: `${m.menteeCount} mentees`,
                            tone: "bg-primary/15 text-primary",
                          },
                        ]}
                        meta={
                          m.categories?.length
                            ? m.categories.slice(0, 3).join(" · ")
                            : `ID ${m.mentorId.slice(-8)}`
                        }
                      >
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#c147e9]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </SaEntityCard>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] bg-muted px-6 py-16 text-center ring-1 ring-border">
                  <p className="text-base font-bold text-foreground">
                    No mentor assignments yet
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Data appears when categories have mentors and students, or when
                    explicit mentor assignments exist.
                  </p>
                </div>
              )}
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
};

export default MentorshipPage;
