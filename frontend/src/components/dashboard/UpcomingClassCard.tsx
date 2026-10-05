import { Calendar, Clock, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { liveClass } from "@/types";

interface UpcomingClassCardProps {
  liveClass: liveClass;
  onJoin?: () => void;
}

const UpcomingClassCard = ({ liveClass, onJoin }: UpcomingClassCardProps) => {
  const isLive = liveClass.status === "live";

  return (
    <Card className={isLive ? "border-green-500/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={isLive ? "bg-green-100 text-green-700 animate-pulse" : "bg-blue-100 text-blue-700"}>
            {isLive ? "Live Now" : "Upcoming"}
          </Badge>
          <span className="text-xs text-muted-foreground">{liveClass.category?.name}</span>
        </div>
        <CardTitle className="text-base">{liveClass.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(liveClass.scheduledDate), "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(liveClass.scheduledDate), "h:mm a")}
        </div>
        {isLive && (
          <Button size="sm" className="w-full mt-2" onClick={onJoin}>
            <Video className="h-3 w-3 mr-1" /> Join Class
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingClassCard;