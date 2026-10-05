import { useState } from "react";
import { StickyNote, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import type { mentorNote } from "@/types";

interface NotesPanelProps {
  menteeId: string;
  notes: mentorNote[];
  allowCompose?: boolean;
  onNoteAdded?: (note: mentorNote) => void;
  onNoteDeleted?: (noteId: string) => void;
}

const NotesPanel = ({
  menteeId,
  notes,
  allowCompose = true,
  onNoteAdded,
  onNoteDeleted,
}: NotesPanelProps) => {
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !menteeId) return;

    setAdding(true);
    try {
      const { data } = await api.post("/mentorship/notes", {
        menteeId,
        content: newNote,
      });
      onNoteAdded?.(data.data.note as mentorNote);
      setNewNote("");
      toast.success("Note added");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add note");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/mentorship/notes/${noteId}`);
      onNoteDeleted?.(noteId);
      toast.success("Note deleted");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete note");
    }
  };

  const menteeLabel = (note: mentorNote) => note.mentee?.name || null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StickyNote className="h-4 w-4 shrink-0 text-primary" />
          <h4 className="text-sm font-medium">Private Notes</h4>
          <span className="text-xs text-muted-foreground">
            (Only visible to you)
          </span>
        </div>

        {allowCompose ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a private note about this mentee..."
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[5rem] resize-y"
            />
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleAddNote}
              disabled={adding || !newNote.trim() || !menteeId}
            >
              {adding ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" /> Add Note
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
            Select a mentee above to add a new note.
          </p>
        )}

        <div className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto overscroll-contain sm:max-h-80">
          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No notes yet
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note._id}
                className="rounded-xl bg-muted p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {menteeLabel(note) ? (
                      <p className="mb-1 text-[11px] font-semibold text-primary">
                        {menteeLabel(note)}
                      </p>
                    ) : null}
                    <p className="break-words text-sm">{note.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note._id)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-red-500"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesPanel;
