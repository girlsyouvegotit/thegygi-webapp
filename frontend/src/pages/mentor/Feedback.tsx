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
import FeedbackList from "@/components/mentorship/FeedbackList";
import FeedbackForm from "@/components/mentorship/FeedbackForm";
import type { mentorFeedback, mentorAssignment, user, category } from "@/types";
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

const Feedback = () => {
  const [feedback, setFeedback] = useState<mentorFeedback[]>([]);
  const [mentees, setMentees] = useState<user[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<user | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fbRes, menteesRes] = await Promise.all([
        api.get("/mentorship/feedback"),
        api.get("/mentorship/my-mentees"),
      ]);
      setFeedback(fbRes.data.data.feedback || []);
      const assignments = (menteesRes.data.data.assignments ||
        []) as mentorAssignment[];
      const all: user[] = [];
      for (const a of assignments) {
        for (const m of a.mentees || []) all.push(m);
      }
      setMentees(all);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryIdFor = (mentee: user): string => {
    const cat = mentee.categories?.[0];
    if (!cat) return "";
    return typeof cat === "string" ? cat : (cat as category)._id;
  };

  return (
    <div className={mentorPageShell}>
      <div className={mentorPageHeader}>
        <div className="min-w-0">
          <h1 className={mentorPageTitle}>Feedback</h1>
          <p className={mentorPageSubtitle}>
            Provide feedback to your mentees
          </p>
        </div>
        <Button className={mentorPageAction} onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Feedback
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <FeedbackList feedback={feedback} />
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
                ? `Feedback for ${selectedMentee.name}`
                : "Provide Feedback"}
            </DialogTitle>
          </DialogHeader>

          <div className={mentorModalBodyClass}>
            {!selectedMentee ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select a mentee to give feedback on.
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
              <FeedbackForm
                menteeId={selectedMentee._id}
                categoryId={categoryIdFor(selectedMentee)}
                onSuccess={() => {
                  setCreateOpen(false);
                  setSelectedMentee(null);
                  load();
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

export default Feedback;
