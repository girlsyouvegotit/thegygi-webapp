import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { HeartHandshake, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import type { mentorAssignment, user, category } from "@/types";
import EmptyState from "@/components/global/EmptyState";

const MentorshipManagement = () => {
  const [assignments, setAssignments] = useState<mentorAssignment[]>([]);
  const [mentors, setMentors] = useState<user[]>([]);
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [maxMentees, setMaxMentees] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, mentorsRes, categoriesRes] = await Promise.all([
        api.get("/mentorship/assignments"),
        api.get("/users?role=mentor"),
        api.get("/categories"),
      ]);
      setAssignments(assignmentsRes.data.data.assignments);
      setMentors(mentorsRes.data.data.users);
      setCategories(categoriesRes.data.data.categories);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async () => {
    if (!selectedMentor || !selectedCategory) {
      toast.error("Please select mentor and category");
      return;
    }
    try {
      await api.post("/mentorship/assignments", {
        mentorId: selectedMentor,
        categoryId: selectedCategory,
        maxMentees,
      });
      toast.success("Mentor assigned");
      setCreateOpen(false);
      setSelectedMentor("");
      setSelectedCategory("");
      setMaxMentees(10);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign mentor");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await api.delete(`/mentorship/assignments/${assignmentId}`);
      toast.success("Assignment removed");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to remove assignment");
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
          <h2 className="text-2xl font-bold">Mentorship Management</h2>
          <p className="text-muted-foreground">
            Manage mentor assignments and mentees
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Assign Mentor
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments"
          description="Assign mentors to categories to get started"
          icon={<HeartHandshake className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={assignment.mentor?.avatar}
                        alt={assignment.mentor?.name}
                      />
                      <AvatarFallback>
                        {assignment.mentor?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {assignment.mentor?.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {assignment.mentor?.email}
                      </p>
                    </div>
                  </div>
                  <Badge>{assignment.category?.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {assignment.mentees?.length || 0} / {assignment.maxMentees}{" "}
                    mentees
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAssignment(assignment._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                {assignment.mentees && assignment.mentees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {assignment.mentees.map((mentee: any) => (
                      <Badge key={mentee._id} variant="outline">
                        {mentee.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Mentor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mentor</label>
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mentors.map((mentor) => (
                    <SelectItem key={mentor._id} value={mentor._id}>
                      {mentor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Max Mentees</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxMentees}
                onChange={(e) => setMaxMentees(parseInt(e.target.value))}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateAssignment}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorshipManagement;
