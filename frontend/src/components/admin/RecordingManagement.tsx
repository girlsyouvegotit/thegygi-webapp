import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PlayCircle, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { recording } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import DeleteRecordingDialog from "@/components/recordings/DeleteRecordingDialog";

const RecordingManagement = () => {
  const [recordings, setRecordings] = useState<recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<recording | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/recordings?limit=200");
      setRecordings(data.data.recordings);
    } catch {
      toast.error("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecordings();
  }, []);

  const handleDownload = async (recordingId: string) => {
    try {
      const { data } = await api.get(`/recordings/${recordingId}/download`);
      window.open(data.data.downloadUrl, "_blank");
      toast.success("Download started");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to download");
    }
  };

  const handleConfirmDelete = async (password: string) => {
    if (!pendingDelete) return;
    const deletedId = pendingDelete._id;
    setDeleting(true);
    try {
      await api.delete(`/recordings/${deletedId}`, {
        data: { password },
      });
      setRecordings((prev) => prev.filter((r) => r._id !== deletedId));
      setPendingDelete(null);
      toast.success("Recording deleted");
    } catch (error) {
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Recording Management</h2>
        <p className="text-muted-foreground">Manage all class recordings</p>
      </div>

      {recordings.length === 0 ? (
        <EmptyState
          title="No recordings"
          description="Recordings will appear here after classes"
          icon={<PlayCircle className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {recordings.map((rec) => (
            <Card key={rec._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          rec.processingStatus === "ready"
                            ? "bg-green-100 text-green-700"
                            : rec.processingStatus === "processing"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {rec.processingStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {rec.category?.name}
                      </span>
                    </div>
                    <h3 className="mt-1 font-medium">
                      {rec.classId?.title || "Recording"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rec.tutor?.name} •{" "}
                      {format(new Date(rec.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {rec.processingStatus === "ready" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDownload(rec._id)}
                      >
                        <Download className="mr-1 h-3 w-3" /> Download
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingDelete(rec)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteRecordingDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
        recordingTitle={
          pendingDelete?.classId?.title ||
          pendingDelete?.category?.name ||
          "this class"
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default RecordingManagement;
