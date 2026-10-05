import {
  Calendar,
  Clock,
  Users,
  Video,
  PlayCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { liveClass } from "@/types";
import { useNavigate } from "react-router";

interface ClassDetailsProps {
  liveClass: liveClass;
  onJoin?: () => void;
  onStart?: () => void;
  isTutor?: boolean;
}

const ClassDetails = ({
  liveClass,
  onJoin,
  onStart,
  isTutor,
}: ClassDetailsProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "live":
        return (
          <Badge className="bg-green-100 text-green-700 animate-pulse">
            Live
          </Badge>
        );
      case "ended":
        return <Badge variant="secondary">Ended</Badge>;
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>
        );
      case "recorded":
        return (
          <Badge className="bg-purple-100 text-purple-700">Recorded</Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          {getStatusBadge(liveClass.status)}
          <Badge variant="outline">{liveClass.category?.name}</Badge>
        </div>
        <CardTitle className="text-2xl">{liveClass.title}</CardTitle>
        <CardDescription>{liveClass.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(liveClass.scheduledDate), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(liveClass.scheduledDate), "h:mm a")} •{" "}
              {liveClass.duration} mins
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{liveClass.tutor?.name || "Tutor"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Max {liveClass.maxParticipants} participants</span>
          </div>
        </div>

        <Separator />

        <div className="flex gap-3">
          {liveClass.status === "live" && (
            <Button className="flex-1" onClick={isTutor ? onStart : onJoin}>
              <Video className="h-4 w-4 mr-2" />
              {isTutor ? "Enter Class" : "Join Class"}
            </Button>
          )}

          {liveClass.status === "scheduled" && isTutor && (
            <Button className="flex-1" onClick={onStart}>
              <Video className="h-4 w-4 mr-2" />
              Start Class
            </Button>
          )}

          {liveClass.status === "recorded" && liveClass.recordingId && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/recordings/${liveClass.recordingId}`)}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Watch Recording
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassDetails;
