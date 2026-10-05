import { HeartHandshake, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { user } from "@/types";

interface MentorCardProps {
  mentor: user;
  nextSessionDate?: string;
  activeGoals?: number;
  completedGoals?: number;
  onViewDetails?: () => void;
}

const MentorCard = ({
  mentor,
  nextSessionDate,
  activeGoals = 0,
  completedGoals = 0,
  onViewDetails,
}: MentorCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={mentor.avatar} alt={mentor.name} />
            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{mentor.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{mentor.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {mentor.bio}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          {completedGoals}/{activeGoals + completedGoals} goals completed
        </div>

        {nextSessionDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Next session: {new Date(nextSessionDate).toLocaleDateString()}
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          <HeartHandshake className="h-4 w-4 mr-2" />
          View Mentorship
        </Button>
      </CardContent>
    </Card>
  );
};

export default MentorCard;
