import { useState } from "react";
import { PlayCircle, Users, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { quiz } from "@/types";

interface LiveQuizLauncherProps {
  quiz: quiz;
  sessionId: string;
  onLaunch?: () => void;
}

const LiveQuizLauncher = ({
  quiz,
  sessionId,
  onLaunch,
}: LiveQuizLauncherProps) => {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await api.post(`/quizzes/${quiz._id}/launch`, { sessionId });
      toast.success("Quiz launched to all participants");
      onLaunch?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to launch quiz");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{quiz.title}</CardTitle>
          <Badge>{quiz.questions.length} questions</Badge>
        </div>
        <CardDescription>{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          {quiz.duration} minutes
        </div>
        <Button className="w-full" onClick={handleLaunch} disabled={launching}>
          {launching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Launching...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" /> Launch Live Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LiveQuizLauncher;
