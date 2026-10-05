import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  HeartHandshake,
  Loader2,
  Trash2,
  UserPlus,
  Users,
  X,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { category, mentorAssignment, user } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";

interface ApiError {
  response?: { data?: { message?: string } };
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

type MentorOption = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  assignmentId: string;
  menteeCount: number;
  maxMentees: number;
  seatsLeft: number;
};

type StudentOption = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  currentMentorId: string | null;
  currentMentorName: string | null;
};

const MentorAssignment = () => {
  const [assignments, setAssignments] = useState<mentorAssignment[]>([]);
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [listQuery, setListQuery] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [mentorOptions, setMentorOptions] = useState<MentorOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, categoriesRes] = await Promise.all([
        api.get("/mentorship/assignments"),
        api.get("/categories"),
      ]);
      setAssignments(
        (assignmentsRes.data.data.assignments as mentorAssignment[]) || [],
      );
      setCategories(
        (categoriesRes.data.data.categories as category[]) || [],
      );
    } catch (error: unknown) {
      console.error("Failed to load mentorship data:", error);
      toast.error(getErrorMessage(error, "Failed to load mentorship data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const fetchOptions = useCallback(async (catId: string) => {
    if (!catId) {
      setMentorOptions([]);
      setStudentOptions([]);
      return;
    }
    setOptionsLoading(true);
    try {
      const { data } = await api.get("/mentorship/assignments/options", {
        params: { categoryId: catId },
      });
      setMentorOptions((data.data.mentors as MentorOption[]) || []);
      setStudentOptions((data.data.students as StudentOption[]) || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load category options"));
      setMentorOptions([]);
      setStudentOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!assignOpen) return;
    void fetchOptions(categoryId);
    setMentorId("");
    setStudentId("");
    setStudentSearch("");
  }, [assignOpen, categoryId, fetchOptions]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return studentOptions;
    return studentOptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [studentOptions, studentSearch]);

  const selectedMentor = mentorOptions.find((m) => m._id === mentorId);
  const selectedStudent = studentOptions.find((s) => s._id === studentId);

  const filteredAssignments = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) => {
      const mentorName = a.mentor?.name?.toLowerCase() || "";
      const catName = a.category?.name?.toLowerCase() || "";
      const menteeHit = (a.mentees || []).some((m) =>
        (m.name || "").toLowerCase().includes(q),
      );
      return mentorName.includes(q) || catName.includes(q) || menteeHit;
    });
  }, [assignments, listQuery]);

  const openAssign = () => {
    setCategoryId(categories[0]?._id || "");
    setMentorId("");
    setStudentId("");
    setStudentSearch("");
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!categoryId || !mentorId || !studentId) {
      toast.error("Select a category, mentor, and student");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/mentorship/assignments/assign-mentee", {
        mentorId,
        studentId,
        categoryId,
      });
      toast.success(
        selectedStudent?.currentMentorId &&
          selectedStudent.currentMentorId !== mentorId
          ? "Student reassigned to the selected mentor"
          : "Student assigned to mentor",
      );
      setAssignOpen(false);
      await fetchAssignments();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to assign student"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMentee = async (
    assignment: mentorAssignment,
    mentee: user,
  ) => {
    try {
      await api.delete("/mentorship/assignments/mentee", {
        data: {
          mentorId: assignment.mentor._id,
          studentId: mentee._id,
          categoryId: assignment.category._id,
        },
      });
      toast.success(`Removed ${mentee.name} from ${assignment.mentor.name}`);
      await fetchAssignments();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to remove mentee"));
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await api.delete(`/mentorship/assignments/${assignmentId}`);
      toast.success("Mentor–category assignment removed");
      await fetchAssignments();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to remove assignment"));
    }
  };

  const initials = (name?: string) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <HeartHandshake className="h-3.5 w-3.5" />
            Category-scoped
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mentorship Management
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Assign a mentor to a student within a shared category. Mentors must
            already be attached to that category.
          </p>
        </div>
        <Button onClick={openAssign} className="rounded-full self-start sm:self-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign student
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          placeholder="Search mentor, category, or mentee…"
          className="rounded-full pl-9"
        />
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState
          title={assignments.length === 0 ? "No assignments" : "No matches"}
          description={
            assignments.length === 0
              ? "Attach mentors to categories first (Categories page), then assign students here."
              : "Try a different search."
          }
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const seatsLeft = Math.max(
              0,
              (assignment.maxMentees || 0) -
                (assignment.mentees?.length || 0),
            );
            return (
              <Card key={assignment._id} className="min-w-0 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={assignment.mentor?.avatar}
                          alt={assignment.mentor?.name}
                        />
                        <AvatarFallback>
                          {initials(assignment.mentor?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {assignment.mentor?.name}
                        </CardTitle>
                        <p className="truncate text-xs text-muted-foreground">
                          {assignment.mentor?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="max-w-[12rem] truncate rounded-full">
                        {assignment.category?.name}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full",
                          seatsLeft === 0 && "bg-rose-500/10 text-rose-600",
                        )}
                      >
                        {assignment.mentees?.length || 0}/
                        {assignment.maxMentees} mentees
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => handleDeleteAssignment(assignment._id)}
                        aria-label="Remove mentor from category"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!assignment.mentees?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No students assigned yet.
                    </p>
                  ) : (
                    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {(assignment.mentees as user[]).map((mentee) => (
                        <li
                          key={mentee._id}
                          className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={mentee.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {initials(mentee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {mentee.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {mentee.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full"
                            onClick={() =>
                              void handleRemoveMentee(assignment, mentee)
                            }
                            aria-label={`Remove ${mentee.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign student to mentor</DialogTitle>
            <DialogDescription>
              Pick a category, then a mentor and student who both belong to it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {optionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Mentor in this category
                  </label>
                  <select
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    disabled={!categoryId || mentorOptions.length === 0}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">
                      {!categoryId
                        ? "Select a category first"
                        : mentorOptions.length === 0
                          ? "No mentors on this category"
                          : "Select mentor…"}
                    </option>
                    {mentorOptions.map((m) => (
                      <option
                        key={m._id}
                        value={m._id}
                        disabled={m.seatsLeft === 0}
                      >
                        {m.name} · {m.menteeCount}/{m.maxMentees}
                        {m.seatsLeft === 0 ? " (full)" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedMentor && (
                    <p className="text-[11px] text-muted-foreground">
                      {selectedMentor.seatsLeft} seat
                      {selectedMentor.seatsLeft === 1 ? "" : "s"} left
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Student in this category
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Filter students…"
                      className="mb-2 rounded-xl pl-9"
                      disabled={!categoryId}
                    />
                  </div>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={!categoryId || filteredStudents.length === 0}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">
                      {!categoryId
                        ? "Select a category first"
                        : filteredStudents.length === 0
                          ? "No students in this category"
                          : "Select student…"}
                    </option>
                    {filteredStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                        {s.currentMentorName
                          ? ` · currently: ${s.currentMentorName}`
                          : " · unassigned"}
                      </option>
                    ))}
                  </select>
                  {selectedStudent?.currentMentorId &&
                    selectedStudent.currentMentorId !== mentorId &&
                    mentorId && (
                      <p className="text-[11px] text-amber-600">
                        This will move them from{" "}
                        {selectedStudent.currentMentorName} to the selected
                        mentor.
                      </p>
                    )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={
                submitting ||
                !categoryId ||
                !mentorId ||
                !studentId ||
                (selectedMentor?.seatsLeft === 0 &&
                  selectedStudent?.currentMentorId !== mentorId)
              }
              onClick={() => void handleAssign()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorAssignment;
