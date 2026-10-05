import ClassCard from "./ClassCard";
import type { liveClass } from "@/types";
import { Loader2 } from "lucide-react";
import EmptyState from "@/components/global/EmptyState";

interface ClassListProps {
  classes: liveClass[];
  loading?: boolean;
  isTutor?: boolean;
  onJoin?: (classId: string) => void;
  onStart?: (classId: string) => void;
}

const ClassList = ({ classes, loading, isTutor, onJoin, onStart }: ClassListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        title="No classes found"
        description={isTutor ? "Schedule your first class to get started" : "No classes available in your categories yet"}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((liveClass) => (
        <ClassCard
          key={liveClass._id}
          liveClass={liveClass}
          isTutor={isTutor}
          onJoin={() => onJoin?.(liveClass._id)}
          onStart={() => onStart?.(liveClass._id)}
        />
      ))}
    </div>
  );
};

export default ClassList;