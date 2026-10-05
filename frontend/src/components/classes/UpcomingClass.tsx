import { Calendar, Clock, Users, Video } from "lucide-react";
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

interface UpcomingClassProps {
  liveClass: liveClass;
  onJoin?: () => void;
  isTutor?: boolean;
}

const UpcomingClass = ({ liveClass, onJoin, isTutor }: UpcomingClassProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/10 text-primary">
            {liveClass.status === "live" ? "Live Now" : "Upcoming"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {liveClass.category?.name}
          </span>
        </div>
        <CardTitle className="text-lg">{liveClass.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {liveClass.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(liveClass.scheduledDate), "EEEE, MMMM d, yyyy")}
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
          <Button className="w-full" onClick={onJoin}>
            <Video className="h-4 w-4 mr-2" />
            {isTutor ? "Enter Class" : "Join Now"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingClass;
