import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  HeartHandshake,
  Users,
  MoreHorizontal,
  Loader2,
  FolderTree,
  ArrowUpRight,
  Search,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryForm from "@/components/category/CategoryForm";
import type { category, user } from "@/types";
import EmptyState from "@/components/global/EmptyState";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const Categories = () => {
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<category | null>(null);
  const [search, setSearch] = useState("");

  // Assignment states
  const [assignTutorOpen, setAssignTutorOpen] = useState(false);
  const [assignMentorOpen, setAssignMentorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<category | null>(
    null,
  );
  const [tutors, setTutors] = useState<user[]>([]);
  const [mentors, setMentors] = useState<user[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [maxMentees, setMaxMentees] = useState(10);
  const [assigning, setAssigning] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      const list = (data.data.categories as category[]) || [];
      setCategories(
        list.map((c) => ({
          ...c,
          _id: String(c._id),
          studentCount:
            c.studentCount ??
            (Array.isArray(c.students) ? c.students.length : 0),
          tutorCount:
            c.tutorCount ?? (Array.isArray(c.tutors) ? c.tutors.length : 0),
          mentorCount:
            c.mentorCount ??
            (Array.isArray(c.mentors) ? c.mentors.length : 0),
        })),
      );
    } catch (error: unknown) {
      console.error("Failed to load categories:", error);
      toast.error(getErrorMessage(error, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTutors = useCallback(async () => {
    try {
      const { data } = await api.get("/users?role=tutor&limit=200");
      setTutors((data.data?.users as user[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load tutors:", error);
    }
  }, []);

  const fetchMentors = useCallback(async () => {
    try {
      const { data } = await api.get("/users?role=mentor&limit=200");
      setMentors((data.data?.users as user[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load mentors:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchTutors();
    fetchMentors();
  }, [fetchCategories, fetchTutors, fetchMentors]);

  const handleAssignTutor = async () => {
    if (!selectedCategory || !selectedTutorId) {
      toast.error("Please select a tutor");
      return;
    }

    setAssigning(true);
    try {
      await api.post(`/categories/${selectedCategory._id}/assign-tutor`, {
        tutorId: selectedTutorId,
      });
      toast.success("Tutor assigned successfully");
      setAssignTutorOpen(false);
      setSelectedTutorId("");
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to assign tutor"));
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedCategory || !selectedMentorId) {
      toast.error("Please select a mentor");
      return;
    }

    setAssigning(true);
    try {
      await api.post(`/categories/${selectedCategory._id}/assign-mentor`, {
        mentorId: selectedMentorId,
        maxMentees,
      });
      toast.success("Mentor assigned successfully");
      setAssignMentorOpen(false);
      setSelectedMentorId("");
      setSelectedCategory(null);
      setMaxMentees(10);
      fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to assign mentor"));
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteId}`);
      toast.success("Category deleted");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete category"));
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase()),
  );

  // Aggregate stats — prefer live role lists for header totals so tutors
  // who exist on the platform still show even before Category.tutors syncs.
  const totalStudents = categories.reduce(
    (sum, c) => sum + (c.studentCount || 0),
    0,
  );
  const assignedTutorTotal = categories.reduce(
    (sum, c) => sum + (c.tutorCount || 0),
    0,
  );
  const assignedMentorTotal = categories.reduce(
    (sum, c) => sum + (c.mentorCount || 0),
    0,
  );
  const totalTutors = Math.max(tutors.length, assignedTutorTotal);
  const totalMentors = Math.max(mentors.length, assignedMentorTotal);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-violet-500/20 border-t-violet-600 animate-spin"></div>
            <FolderTree className="absolute inset-0 m-auto w-5 h-5 text-violet-600 animate-pulse" />
          </div>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5 overflow-x-hidden pb-8 sm:space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Categories
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 text-[10px] font-bold uppercase tracking-wider">

                {categories.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage learning categories and assignments
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search categories by name or description..."
            className="pl-9 w-full bg-white border-slate-200 rounded-xl h-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* ============================================ */}
      {/* SUMMARY STATS STRIP */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
        <div className="rounded-[20px] border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {totalStudents.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
            Total Students
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {totalTutors.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
            Total Tutors
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200/60 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {totalMentors.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
            Total Mentors
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* CATEGORIES GRID */}
      {/* ============================================ */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200/60 bg-white py-16 px-6">
          <EmptyState
            title="No categories found"
            description={
              search
                ? `No results for "${search}"`
                : "Create your first category to get started"
            }
            icon={<FolderTree className="h-8 w-8 text-slate-300" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="group relative overflow-hidden rounded-[20px] border border-slate-200/60 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              {/* Banner */}
              {category.bannerImage ? (
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={category.bannerImage}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-indigo-500/10 flex items-center justify-center relative">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <span className="text-2xl">{category.icon || "📚"}</span>
                  </div>
                </div>
              )}

              <div className="p-5">
                {/* Title & Menu */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base truncate">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {category.description}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCategory(category);
                          setFormOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setAssignTutorOpen(true);
                        }}
                        className="gap-2"
                      >
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                        Assign Tutor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setAssignMentorOpen(true);
                        }}
                        className="gap-2"
                      >
                        <HeartHandshake className="h-3.5 w-3.5 text-amber-500" />
                        Assign Mentor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 gap-2 focus:text-rose-700"
                        onClick={() => {
                          setDeleteId(category._id);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {category.studentCount || 0}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium gap-1">
                    <GraduationCap className="h-2.5 w-2.5" />
                    {category.tutorCount || 0}
                  </Badge>
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium gap-1">
                    <HeartHandshake className="h-2.5 w-2.5" />
                    {category.mentorCount || 0}
                  </Badge>
                </div>

                {/* Quick Assign Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-[11px] h-8 font-semibold bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 gap-1"
                    onClick={() => {
                      setSelectedCategory(category);
                      setAssignTutorOpen(true);
                    }}
                  >
                    <GraduationCap className="w-3 h-3" />
                    Tutor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-[11px] h-8 font-semibold bg-white border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 gap-1"
                    onClick={() => {
                      setSelectedCategory(category);
                      setAssignMentorOpen(true);
                    }}
                  >
                    <HeartHandshake className="w-3 h-3" />
                    Mentor
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* CREATE/EDIT CATEGORY FORM */}
      {/* ============================================ */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingCategory}
        onSuccess={fetchCategories}
      />

      {/* ============================================ */}
      {/* ASSIGN TUTOR DIALOG */}
      {/* ============================================ */}
      <Dialog open={assignTutorOpen} onOpenChange={setAssignTutorOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-5 sm:p-6 rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              Assign Tutor
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Assign a tutor to{" "}
              <span className="font-semibold text-slate-900">
                {selectedCategory?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {tutors.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No tutors available</p>
                <p className="text-xs text-slate-400 mt-1">
                  Change a user's role to "Tutor" from the Users page
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Tutor
                </label>
                <Select
                  value={selectedTutorId}
                  onValueChange={setSelectedTutorId}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue placeholder="Choose a tutor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((tutor) => (
                      <SelectItem key={tutor._id} value={tutor._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={tutor.avatar} alt={tutor.name} />
                            <AvatarFallback className="text-[9px] bg-blue-500/10 text-blue-600 font-bold">
                              {getInitials(tutor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{tutor.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 bg-white border-slate-200"
                onClick={() => setAssignTutorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                onClick={handleAssignTutor}
                disabled={assigning || !selectedTutorId}
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Tutor
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* ASSIGN MENTOR DIALOG */}
      {/* ============================================ */}
      <Dialog open={assignMentorOpen} onOpenChange={setAssignMentorOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-5 sm:p-6 rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-amber-600" />
              </div>
              Assign Mentor
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Assign a mentor to{" "}
              <span className="font-semibold text-slate-900">
                {selectedCategory?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {mentors.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <HeartHandshake className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No mentors available</p>
                <p className="text-xs text-slate-400 mt-1">
                  Change a user's role to "Mentor" from the Users page
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Select Mentor
                  </label>
                  <Select
                    value={selectedMentorId}
                    onValueChange={setSelectedMentorId}
                  >
                    <SelectTrigger className="mt-2 h-10">
                      <SelectValue placeholder="Choose a mentor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor._id} value={mentor._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage
                                src={mentor.avatar}
                                alt={mentor.name}
                              />
                              <AvatarFallback className="text-[9px] bg-amber-500/10 text-amber-600 font-bold">
                                {getInitials(mentor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{mentor.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Max Mentees
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxMentees}
                    onChange={(e) =>
                      setMaxMentees(parseInt(e.target.value) || 10)
                    }
                    className="mt-2 h-10"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Maximum number of students this mentor can handle
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 bg-white border-slate-200"
                onClick={() => setAssignMentorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
                onClick={handleAssignMentor}
                disabled={assigning || !selectedMentorId}
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Mentor
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ============================================ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm p-5 sm:p-6 rounded-[20px]">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-base font-bold">
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this category? All associated data
              will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 bg-white border-slate-200"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
