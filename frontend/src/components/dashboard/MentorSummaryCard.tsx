import { HeartHandshake, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface MentorSummaryCardProps {
  mentorName: string;
  nextSessionDate?: string;
  activeGoals: number;
  completedGoals: number;
}

const MentorSummaryCard = ({
  mentorName,
  nextSessionDate,
  activeGoals,
  completedGoals,
}: MentorSummaryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <HeartHandshake className="h-4 w-4 text-primary" />
          Your Mentor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-semibold">{mentorName}</p>

        {nextSessionDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Next session: {new Date(nextSessionDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          {completedGoals}/{activeGoals + completedGoals} goals completed
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => navigate("/mentorship")}
        >
          View Mentorship
        </Button>
      </CardContent>
    </Card>
  );
};

export default MentorSummaryCard;
