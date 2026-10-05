import { useState, useCallback } from "react";
import { useMentorship } from "@/hooks/useMentorship";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SessionList from "@/components/mentorship/SessionList";
import SessionScheduler from "@/components/mentorship/SessionScheduler";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
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

const Sessions = () => {
  const { user } = useAuth();
  const { sessions, fetchSessions } = useMentorship();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleComplete = useCallback(
    async (sessionId: string) => {
      try {
        await api.post(`/mentorship/sessions/${sessionId}/complete`);
        toast.success("Session completed");
        fetchSessions();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to complete session"));
      }
    },
    [fetchSessions],
  );

  const handleCancel = useCallback(
    async (sessionId: string) => {
      try {
        await api.delete(`/mentorship/sessions/${sessionId}/cancel`);
        toast.success("Session cancelled");
        fetchSessions();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to cancel session"));
      }
    },
    [fetchSessions],
  );

  const handleJoin = useCallback((sessionId: string) => {
    window.location.href = `/live-session/${sessionId}`;
  }, []);

  return (
    <div className={mentorPageShell}>
      <div className={mentorPageHeader}>
        <div className="min-w-0">
          <h1 className={mentorPageTitle}>Sessions</h1>
          <p className={mentorPageSubtitle}>Your mentorship sessions</p>
        </div>
        <Button
          className={mentorPageAction}
          onClick={() => setScheduleOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Schedule Session
        </Button>
      </div>

      <SessionList
        sessions={sessions}
        isMentor={user?.role === "mentor"}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onJoin={handleJoin}
      />

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent
          className={mentorModalContentClass}
          showCloseButton={false}
        >
          <DialogHeader className={mentorModalHeaderClass}>
            <DialogTitle>Schedule Session</DialogTitle>
          </DialogHeader>
          <div className={mentorModalBodyClass}>
            <SessionScheduler
              onSuccess={() => {
                setScheduleOpen(false);
                fetchSessions();
              }}
              onCancel={() => setScheduleOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
