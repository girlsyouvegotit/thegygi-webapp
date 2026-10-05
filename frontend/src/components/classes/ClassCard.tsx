import { Calendar, Clock, Users, Video, PlayCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { liveClass } from "@/types";
import { useNavigate } from "react-router";

interface ClassCardProps {
  liveClass: liveClass;
  onJoin?: () => void;
  onStart?: () => void;
  isTutor?: boolean;
}

const ClassCard = ({ liveClass, onJoin, onStart, isTutor }: ClassCardProps) => {
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          {getStatusBadge(liveClass.status)}
          <Badge variant="outline">{liveClass.category?.name}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{liveClass.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {liveClass.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(liveClass.scheduledDate), "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {format(new Date(liveClass.scheduledDate), "h:mm a")} •{" "}
          {liveClass.duration} mins
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {liveClass.tutor?.name || "Tutor"}
        </div>

        {liveClass.status === "live" && (
          <Button className="w-full" onClick={isTutor ? onStart : onJoin}>
            <Video className="h-4 w-4 mr-2" />
            {isTutor ? "Enter Class" : "Join Class"}
          </Button>
        )}

        {liveClass.status === "recorded" && liveClass.recordingId && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/recordings/${liveClass.recordingId}`)}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Watch Recording
          </Button>
        )}

        {liveClass.status === "scheduled" && isTutor && (
          <Button className="w-full" onClick={onStart}>
            <Video className="h-4 w-4 mr-2" />
            Start Class
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassCard;
