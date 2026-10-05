import { Calendar, Clock, Video, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { mentorshipSession } from "@/types";

interface SessionListProps {
  sessions: mentorshipSession[];
  isMentor?: boolean;
  onComplete?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  onJoin?: (sessionId: string) => void;
}

const SessionList = ({
  sessions,
  isMentor,
  onComplete,
  onCancel,
  onJoin,
}: SessionListProps) => {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center text-muted-foreground">
        <Calendar className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">No sessions scheduled</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case "live":
        return (
          <Badge className="animate-pulse bg-green-100 text-green-700">
            Live
          </Badge>
        );
      case "completed":
        return <Badge className="bg-gray-100 text-gray-700">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session._id} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {getStatusBadge(session.status)}
                  <span className="text-xs text-muted-foreground capitalize">
                    {session.type?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="truncate font-medium text-slate-900 sm:whitespace-normal">
                  {session.topic}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {format(new Date(session.scheduledDate), "MMM d, yyyy")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {format(new Date(session.scheduledDate), "h:mm a")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                {session.status === "live" && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => onJoin?.(session._id)}
                  >
                    <Video className="mr-1 h-3 w-3" /> Join
                  </Button>
                )}
                {isMentor && session.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => onComplete?.(session._id)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => onCancel?.(session._id)}
                    >
                      <XCircle className="mr-1 h-3 w-3" /> Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionList;
