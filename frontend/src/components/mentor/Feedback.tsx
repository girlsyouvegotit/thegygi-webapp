import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Star, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  email?: string;
  avatar?: string;
}

interface FeedbackItem {
  _id: string;
  projectTitle: string;
  technicalSkills: number;
  uiUx?: number;
  problemSolving?: number;
  communication?: number;
  overall: number;
  feedback: string;
  recommendations: string[];
  mentee?: Mentee;
  createdAt: string;
}

interface FeedbackFormData {
  menteeId: string;
  categoryId: string;
  projectTitle: string;
  technicalSkills: number;
  uiUx: number;
  problemSolving: number;
  communication: number;
  overall: number;
  feedback: string;
  recommendations: string[];
}

const Feedback = () => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [formData, setFormData] = useState<FeedbackFormData>({
    menteeId: "",
    categoryId: "",
    projectTitle: "",
    technicalSkills: 5,
    uiUx: 5,
    problemSolving: 5,
    communication: 5,
    overall: 5,
    feedback: "",
    recommendations: [],
  });
  const [newRecommendation, setNewRecommendation] = useState("");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/feedback/mentee");
      setFeedbackList((data.data.feedback as FeedbackItem[]) || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to load feedback:", error);
      toast.error(err.response?.data?.message || "Failed to load feedback");
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
    fetchFeedback();
    fetchMentees();
  }, [fetchFeedback, fetchMentees]);

  const handleSubmitFeedback = async () => {
    if (!formData.menteeId || !formData.projectTitle || !formData.feedback) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/mentorship/feedback", formData);
      toast.success("Feedback submitted");
      setCreateOpen(false);
      setFormData({
        menteeId: "",
        categoryId: "",
        projectTitle: "",
        technicalSkills: 5,
        uiUx: 5,
        problemSolving: 5,
        communication: 5,
        overall: 5,
        feedback: "",
        recommendations: [],
      });
      fetchFeedback();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  const SkillRating = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${
              rating <= value
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

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
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Provide feedback to your mentees
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Feedback
        </Button>
      </div>

      {feedbackList.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Provide feedback to help your mentees grow"
          icon={<Star className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbackList.map((feedback) => (
            <Card key={feedback._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {feedback.projectTitle}
                  </CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    {feedback.overall}/10
                  </Badge>
                </div>
                <CardDescription>
                  {feedback.mentee?.name} •{" "}
                  {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {feedback.feedback}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Technical</p>
                    <p className="font-bold">{feedback.technicalSkills}/10</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Problem Solving</p>
                    <p className="font-bold">
                      {feedback.problemSolving || "N/A"}/10
                    </p>
                  </div>
                </div>
                {feedback.recommendations &&
                  feedback.recommendations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feedback.recommendations.map(
                        (rec: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {rec}
                          </Badge>
                        ),
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Feedback Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Feedback</DialogTitle>
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
              <label className="text-sm font-medium">Project Title</label>
              <Input
                value={formData.projectTitle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectTitle: e.target.value,
                  }))
                }
                placeholder="e.g., Portfolio Website"
              />
            </div>

            <SkillRating
              label="Technical Skills"
              value={formData.technicalSkills}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, technicalSkills: value }))
              }
            />
            <SkillRating
              label="UI/UX"
              value={formData.uiUx}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, uiUx: value }))
              }
            />
            <SkillRating
              label="Problem Solving"
              value={formData.problemSolving}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, problemSolving: value }))
              }
            />
            <SkillRating
              label="Communication"
              value={formData.communication}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, communication: value }))
              }
            />
            <SkillRating
              label="Overall"
              value={formData.overall}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, overall: value }))
              }
            />

            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={formData.feedback}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feedback: e.target.value }))
                }
                placeholder="Provide detailed feedback..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recommendations</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="Add a recommendation"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newRecommendation.trim()) {
                        setFormData((prev) => ({
                          ...prev,
                          recommendations: [
                            ...prev.recommendations,
                            newRecommendation.trim(),
                          ],
                        }));
                        setNewRecommendation("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newRecommendation.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        recommendations: [
                          ...prev.recommendations,
                          newRecommendation.trim(),
                        ],
                      }));
                      setNewRecommendation("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {formData.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.recommendations.map((rec, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {rec}
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recommendations: prev.recommendations.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feedback;
