import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { milestone } from "@/types";

interface MilestoneListProps {
  milestones: milestone[];
  onToggle?: (milestoneId: string, completed: boolean) => void;
  onAdd?: (title: string) => void;
  editable?: boolean;
}

const MilestoneList = ({ milestones, onToggle, onAdd, editable = false }: MilestoneListProps) => {
  const [newMilestone, setNewMilestone] = useState("");

  const handleAdd = () => {
    if (newMilestone.trim()) {
      onAdd?.(newMilestone.trim());
      setNewMilestone("");
    }
  };

  if (milestones.length === 0 && !editable) {
    return <p className="text-sm text-muted-foreground">No milestones yet</p>;
  }

  return (
    <div className="space-y-2">
      {milestones.map((milestone) => (
        <div key={milestone._id} className="flex items-center gap-3">
          <button
            onClick={() => onToggle?.(milestone._id, !milestone.completed)}
            disabled={!editable}
            className="disabled:cursor-default"
          >
            {milestone.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <span className={`text-sm flex-1 ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
            {milestone.title}
          </span>
          {milestone.completedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(milestone.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}

      {editable && (
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Add milestone..."
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;