import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import GoalTimeline from "@/components/mentorship/GoalTimeline";
import GoalForm from "@/components/mentorship/GoalForm";
import type { mentorshipGoal, mentorAssignment, user, category } from "@/types";
import {
  mentorPageShell,
  mentorPageHeader,
  mentorPageTitle,
  mentorPageSubtitle,
  mentorPageAction,
  mentorModalContentClass,
  mentorModalHeaderClass,
  mentorModalBodyClass,
} from "@/lib/mentorPageStyles";

const flattenMentees = (assignments: mentorAssignment[]): user[] => {
  const out: user[] = [];
  for (const a of assignments) {
    for (const m of a.mentees || []) out.push(m);
  }
  return out;
};

const categoryIdFor = (mentee: user): string => {
  const cat = mentee.categories?.[0];
  if (!cat) return "";
  return typeof cat === "string" ? cat : (cat as category)._id;
};

const Goals = () => {
  const [goals, setGoals] = useState<mentorshipGoal[]>([]);
  const [mentees, setMentees] = useState<user[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<user | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [goalsRes, menteesRes] = await Promise.all([
          api.get("/mentorship/goals"),
          api.get("/mentorship/my-mentees"),
        ]);
        if (cancelled) return;

        setGoals(goalsRes.data.data?.goals ?? []);
        setMentees(flattenMentees(menteesRes.data.data?.assignments ?? []));
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load goals:", error);
        toast.error("Failed to load goals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className={mentorPageShell}>
      <div className={mentorPageHeader}>
        <div className="min-w-0">
          <h1 className={mentorPageTitle}>Goals</h1>
          <p className={mentorPageSubtitle}>
            Track mentee goals and milestones
          </p>
        </div>
        <Button className={mentorPageAction} onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <GoalTimeline goals={goals} />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setSelectedMentee(null);
        }}
      >
        <DialogContent
          className={mentorModalContentClass}
          showCloseButton={false}
        >
          <DialogHeader className={mentorModalHeaderClass}>
            <DialogTitle>
              {selectedMentee
                ? `Goal for ${selectedMentee.name}`
                : "Create Goal"}
            </DialogTitle>
          </DialogHeader>

          <div className={mentorModalBodyClass}>
            {!selectedMentee ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select a mentee for this goal.
                </p>
                <Select
                  value=""
                  onValueChange={(id) => {
                    const m = mentees.find((x) => x._id === id) || null;
                    setSelectedMentee(m);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mentee" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentees.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <GoalForm
                menteeId={selectedMentee._id}
                categoryId={categoryIdFor(selectedMentee)}
                onSuccess={() => {
                  setCreateOpen(false);
                  setSelectedMentee(null);
                  refetch();
                }}
                onCancel={() => {
                  setCreateOpen(false);
                  setSelectedMentee(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
