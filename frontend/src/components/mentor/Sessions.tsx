import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Video,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { mentorshipSession } from "@/types";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Mentee {
  _id: string;
  name: string;
  avatar?: string;
}

interface SessionWithMentee
  extends Omit<mentorshipSession, "mentee"> {
  mentee?: Mentee;
}

interface SessionFormData {
  menteeId: string;
  topic: string;
  description: string;
  scheduledDate: string;
  duration: number;
  type: "one_on_one" | "group";
}

const Sessions = () => {
  const [sessions, setSessions] = useState<SessionWithMentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    menteeId: "",
    topic: "",
    description: "",
    scheduledDate: "",
    duration: 45,
    type: "one_on_one",
  });
  const [mentees, setMentees] = useState<Mentee[]>([]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/sessions/my");
      setSessions((data.data.sessions as SessionWithMentee[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
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
    fetchSessions();
    fetchMentees();
  }, [fetchSessions, fetchMentees]);

  const handleCreateSession = async () => {
    if (!formData.menteeId || !formData.topic || !formData.scheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/mentorship/sessions", {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate),
      });
      toast.success("Session scheduled");
      setCreateOpen(false);
      setFormData({
        menteeId: "",
        topic: "",
        description: "",
        scheduledDate: "",
        duration: 45,
        type: "one_on_one",
      });
      fetchSessions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to schedule session");
    }
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" || s.status === "confirmed",
  );
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled",
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
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mentorship sessions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingSessions.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              description="Schedule a session with your mentees"
              icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            upcomingSessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {pastSessions.length === 0 ? (
            <EmptyState
              title="No past sessions"
              description="Completed sessions will appear here"
              icon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            pastSessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Session Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            <DialogDescription>
              Set up a new mentorship session
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
              <label className="text-sm font-medium">Topic</label>
              <Input
                value={formData.topic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="e.g., Career guidance session"
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
                placeholder="What will be discussed"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <Input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduledDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Duration (mins)</label>
                <Input
                  type="number"
                  min={15}
                  max={180}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "one_on_one" | "group") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_on_one">One on One</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleCreateSession}>
              Schedule Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Session Card Component
const SessionCard = ({ session }: { session: SessionWithMentee }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={session.mentee?.avatar}
              alt={session.mentee?.name}
            />
            <AvatarFallback>{session.mentee?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{session.topic}</p>
              {session.status === "live" && (
                <Badge className="bg-red-100 text-red-700 animate-pulse">
                  Live
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {session.mentee?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(session.scheduledDate), "MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.scheduledDate), "h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {session.duration} mins
          </div>
          {session.status === "live" && (
            <Button size="sm">
              <Video className="h-3 w-3 mr-1" />
              Join Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Sessions;
