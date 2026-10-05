import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Pencil, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Mentee {
  _id: string;
  name: string;
}

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  mentee?: Mentee;
}

interface NoteFormData {
  menteeId: string;
  content: string;
  sessionId: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<NoteFormData>({
    menteeId: "",
    content: "",
    sessionId: "",
  });
  const [mentees, setMentees] = useState<Mentee[]>([]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/notes/mentee");
      setNotes((data.data.notes as Note[]) || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to load notes:", error);
      toast.error(err.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMentees = useCallback(async () => {
    try {
      const { data } = await api.get("/mentorship/my-mentees");
      const allMentees = (
        data.data.assignments as Array<{ mentees?: Mentee[] }>
      ).flatMap((a) => a.mentees || []);
      setMentees(allMentees);
    } catch (error: unknown) {
      console.error("Failed to load mentees:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchMentees();
  }, [fetchNotes, fetchMentees]);

  const handleCreateNote = async () => {
    if (!formData.menteeId || !formData.content) {
      toast.error("Please select a mentee and write a note");
      return;
    }

    try {
      await api.post("/mentorship/notes", formData);
      toast.success("Note created");
      setCreateOpen(false);
      setFormData({ menteeId: "", content: "", sessionId: "" });
      fetchNotes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create note");
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      await api.put(`/mentorship/notes/${editingNote._id}`, {
        content: formData.content,
      });
      toast.success("Note updated");
      setEditingNote(null);
      fetchNotes();
    } catch (error: unknown) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/mentorship/notes/${noteId}`);
      toast.success("Note deleted");
      fetchNotes();
    } catch (error: unknown) {
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Private Notes</h1>
          <p className="text-muted-foreground mt-1">
            Personal notes about your mentees
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Create private notes about your mentees"
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card key={note._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">
                    {note.mentee?.name || "Unknown"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingNote(note);
                        setFormData((prev) => ({
                          ...prev,
                          content: note.content,
                        }));
                      }}
                      aria-label="Edit note"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteNote(note._id)}
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Note Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mentee</label>
              <Select
                value={formData.menteeId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, menteeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mentee" />
                </SelectTrigger>
                <SelectContent>
                  {mentees.map((mentee) => (
                    <SelectItem key={mentee._id} value={mentee._id}>
                      {mentee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Write your private note..."
                rows={5}
              />
            </div>
            <Button className="w-full" onClick={handleCreateNote}>
              Create Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={5}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingNote(null)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdateNote}>
                Update Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
