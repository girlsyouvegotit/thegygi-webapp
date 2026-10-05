import { Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { user } from "@/types";

interface MenteeCardProps {
  mentee: user;
  progress?: number;
  activeGoals?: number;
  nextSessionDate?: string;
  onView?: () => void;
}

const MenteeCard = ({
  mentee,
  progress = 0,
  activeGoals = 0,
  nextSessionDate,
  onView,
}: MenteeCardProps) => {
  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={mentee.avatar} alt={mentee.name} />
            <AvatarFallback>{mentee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{mentee.name}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">
              {mentee.email}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3 w-3 shrink-0" />
          {activeGoals} active goals
        </div>

        {nextSessionDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            Next: {new Date(nextSessionDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenteeCard;
