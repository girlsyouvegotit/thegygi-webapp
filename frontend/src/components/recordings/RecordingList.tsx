import { PlayCircle, Calendar, Clock, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { recording } from "@/types";
import { useNavigate } from "react-router";
import EmptyState from "@/components/global/EmptyState";

interface RecordingListProps {
  recordings: recording[];
  loading?: boolean;
  isAdmin?: boolean;
  /** Base path for the player, e.g. `/recordings` or `/tutor/recordings` */
  watchBasePath?: string;
  onDelete?: (recordingId: string) => void;
  onDownload?: (recordingId: string) => void;
}

const isWatchable = (recording: recording): boolean => {
  if (recording.processingStatus === "archived") return false;
  if (typeof recording.fileSize === "number" && recording.fileSize > 0) {
    return true;
  }
  return recording.processingStatus === "ready";
};

const RecordingList = ({
  recordings,
  loading,
  isAdmin,
  watchBasePath = "/recordings",
  onDelete,
  onDownload,
}: RecordingListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <EmptyState
        title="No recordings available"
        description="Recordings will appear here after a live class is recorded"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recordings.map((recording) => (
        <Card key={recording._id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge
                className={
                  recording.processingStatus === "ready"
                    ? "bg-green-100 text-green-700"
                    : recording.processingStatus === "processing" ||
                        recording.processingStatus === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {recording.processingStatus === "ready"
                  ? "Ready"
                  : recording.processingStatus === "processing" ||
                      recording.processingStatus === "pending"
                    ? "Processing AI"
                    : recording.processingStatus}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {recording.category?.name}
              </span>
            </div>
            <CardTitle className="text-base">
              {recording.classId?.title || "Class Recording"}
            </CardTitle>
            <CardDescription>
              {recording.tutor?.name || "Tutor"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(recording.date), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {Math.round((recording.duration || 0) / 60)} mins
            </div>

            {isWatchable(recording) && (
              <Button
                className="w-full mt-2"
                onClick={() =>
                  navigate(`${watchBasePath}/${recording._id}`)
                }
              >
                <PlayCircle className="h-4 w-4 mr-2" /> Watch
              </Button>
            )}

            {isAdmin && (
              <div className="flex gap-2">
                {isWatchable(recording) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDownload?.(recording._id)}
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDelete?.(recording._id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecordingList;
