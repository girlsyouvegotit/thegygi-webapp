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
import NotesPanel from "@/components/mentorship/NotesPanel";
import type { mentorNote, mentorAssignment, user } from "@/types";
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

const Notes = () => {
  const [notes, setNotes] = useState<mentorNote[]>([]);
  const [mentees, setMentees] = useState<user[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<user | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [notesRes, menteesRes] = await Promise.all([
          api.get("/mentorship/notes"),
          api.get("/mentorship/my-mentees"),
        ]);
        if (cancelled) return;

        setNotes(notesRes.data.data?.notes ?? []);
        setMentees(flattenMentees(menteesRes.data.data?.assignments ?? []));
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load notes:", error);
        toast.error("Failed to load notes");
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

  const visibleNotes = selectedMentee
    ? notes.filter((n) => n.mentee?._id === selectedMentee._id)
    : notes;

  return (
    <div className={mentorPageShell}>
      <div className={mentorPageHeader}>
        <div className="min-w-0">
          <h1 className={mentorPageTitle}>Notes</h1>
          <p className={mentorPageSubtitle}>
            Private notes about your mentees
          </p>
        </div>
        <Button className={mentorPageAction} onClick={() => setPickerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={selectedMentee?._id || "all"}
          onValueChange={(id) => {
            if (id === "all") {
              setSelectedMentee(null);
              return;
            }
            setSelectedMentee(mentees.find((m) => m._id === id) || null);
          }}
        >
          <SelectTrigger className="w-full sm:max-w-xs">
            <SelectValue placeholder="Filter by mentee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All mentees</SelectItem>
            {mentees.map((m) => (
              <SelectItem key={m._id} value={m._id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mx-auto w-full max-w-2xl">
          <NotesPanel
            menteeId={selectedMentee?._id || ""}
            notes={visibleNotes}
            allowCompose={Boolean(selectedMentee)}
            onNoteAdded={() => refetch()}
            onNoteDeleted={() => refetch()}
          />
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          className={mentorModalContentClass}
          showCloseButton={false}
        >
          <DialogHeader className={mentorModalHeaderClass}>
            <DialogTitle>Select a mentee</DialogTitle>
          </DialogHeader>
          <div className={`${mentorModalBodyClass} space-y-3`}>
            <p className="text-sm text-muted-foreground">
              Choose who this note is about.
            </p>
            <Select
              value=""
              onValueChange={(id) => {
                const m = mentees.find((x) => x._id === id) || null;
                setSelectedMentee(m);
                setPickerOpen(false);
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
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
