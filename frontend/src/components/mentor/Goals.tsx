import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Target, CheckCircle2, Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Mentee {
  _id: string;
  name: string;
}

interface Milestone {
  _id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "abandoned";
  targetDate: Date;
  mentee?: Mentee;
  milestones?: Milestone[];
  createdAt: string;
}

interface GoalFormData {
  menteeId: string;
  categoryId: string;
  title: string;
  description: string;
  targetDate: string;
  milestones: string[];
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    menteeId: "",
    categoryId: "",
    title: "",
    description: "",
    targetDate: "",
    milestones: [],
  });
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [newMilestone, setNewMilestone] = useState("");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/goals/mentee");
      setGoals((data.data.goals as Goal[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load goals:", error);
      toast.error("Failed to load goals");
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
    fetchGoals();
    fetchMentees();
  }, [fetchGoals, fetchMentees]);

  const handleCreateGoal = async () => {
    if (!formData.menteeId || !formData.title || !formData.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/mentorship/goals", {
        ...formData,
        milestones: formData.milestones.map((title) => ({ title })),
      });
      toast.success("Goal created");
      setCreateOpen(false);
      setFormData({
        menteeId: "",
        categoryId: "",
        title: "",
        description: "",
        targetDate: "",
        milestones: [],
      });
      fetchGoals();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create goal");
    }
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setFormData((prev) => ({
        ...prev,
        milestones: [...prev.milestones, newMilestone.trim()],
      }));
      setNewMilestone("");
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

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
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track mentee goals and milestones
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeGoals.length === 0 ? (
            <EmptyState
              title="No active goals"
              description="Create goals for your mentees"
              icon={<Target className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            activeGoals.map((goal) => <GoalCard key={goal._id} goal={goal} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedGoals.length === 0 ? (
            <EmptyState
              title="No completed goals"
              description="Completed goals will appear here"
              icon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            completedGoals.map((goal) => (
              <GoalCard key={goal._id} goal={goal} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Goal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
            <DialogDescription>
              Set a new goal for your mentee
            </DialogDescription>
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
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Build a portfolio website"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the goal"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Target Date</label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Milestones</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add a milestone"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMilestone}
                >
                  Add
                </Button>
              </div>
              {formData.milestones.length > 0 && (
                <div className="space-y-1">
                  {formData.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{milestone}</span>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            milestones: prev.milestones.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleCreateGoal}>
              Create Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Goal Card Component
const GoalCard = ({ goal }: { goal: Goal }) => {
  const progress =
    goal.milestones && goal.milestones.length > 0
      ? (goal.milestones.filter((m) => m.completed).length /
          goal.milestones.length) *
        100
      : goal.status === "completed"
        ? 100
        : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{goal.title}</CardTitle>
          <Badge
            className={
              goal.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }
          >
            {goal.status}
          </Badge>
        </div>
        <CardDescription>{goal.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}
        </div>
        <Progress value={progress} className="h-2" />
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="space-y-1">
            {goal.milestones.map((milestone) => (
              <div
                key={milestone._id}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    milestone.completed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {milestone.completed && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                <span
                  className={
                    milestone.completed
                      ? "line-through text-muted-foreground"
                      : ""
                  }
                >
                  {milestone.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Goals;
