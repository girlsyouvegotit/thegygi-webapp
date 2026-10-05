import { FileQuestion, Clock, Calendar, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { quiz } from "@/types";
import { useNavigate } from "react-router";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";

interface QuizListProps {
  quizzes: quiz[];
  loading?: boolean;
  isTutor?: boolean;
}

const QuizList = ({ quizzes, loading, isTutor }: QuizListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes available"
        description={
          isTutor ? "Create your first quiz" : "Quizzes will appear here"
        }
      />
    );
  }

  if (isTutor) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <article
            key={quiz._id}
            className={cn(
              "flex flex-col rounded-2xl border border-slate-200/70 bg-[#FAFAFC] p-4",
              "shadow-[0_8px_30px_-22px_rgba(15,23,42,0.28)] transition-all duration-200",
              "hover:border-primary/25 hover:bg-white hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)]",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  quiz.isActive
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-slate-500/10 text-slate-600",
                )}
              >
                {quiz.isActive ? "Active" : "Inactive"}
              </span>
              {quiz.category?.name && (
                <span className="truncate text-[10px] font-medium text-slate-500">
                  {quiz.category.name}
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
              {quiz.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {quiz.description}
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-3.5 w-3.5 text-primary/70" />
                {quiz.questions.length} questions
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary/70" />
                {quiz.duration} minutes
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                Time limit: {quiz.duration} min
              </div>
            </div>
            <Button
              className="mt-4 h-10 w-full gap-2 rounded-xl bg-primary shadow-sm shadow-primary/20 hover:bg-primary/90"
              onClick={() => navigate(`/tutor/quizzes/${quiz._id}`)}
            >
              Manage
              <ChevronRight className="h-4 w-4" />
            </Button>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <Card key={quiz._id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge
                className={
                  quiz.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {quiz.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {quiz.category?.name}
              </span>
            </div>
            <CardTitle className="text-base">{quiz.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {quiz.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileQuestion className="h-3 w-3" />
              {quiz.questions.length} questions
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {quiz.duration} minutes
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Time limit: {quiz.duration} min
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => navigate(`/quizzes/${quiz._id}`)}
            >
              Take Quiz
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizList;
