import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import RecordingList from "@/components/recordings/RecordingList";
import DeleteRecordingDialog from "@/components/recordings/DeleteRecordingDialog";
import { useAdminPath } from "@/hooks/useAdminPath";
import type { recording } from "@/types";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const RecordingManagement = () => {
  const adminPath = useAdminPath();
  const [recordings, setRecordings] = useState<recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<recording | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/recordings?limit=200");
      setRecordings((data?.data?.recordings as recording[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load recordings:", error);
      toast.error(getErrorMessage(error, "Failed to load recordings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleDownload = async (recordingId: string) => {
    try {
      const { data } = await api.get(`/recordings/${recordingId}/download`);
      window.open(data.data.downloadUrl as string, "_blank");
      toast.success("Download started");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to download"));
    }
  };

  const handleRequestDelete = (recordingId: string) => {
    const target = recordings.find((r) => r._id === recordingId) || null;
    setPendingDelete(target);
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
    } catch (error: unknown) {
      // Surface API message in the dialog (wrong password, etc.)
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Recording Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all class recordings
        </p>
      </div>

      <RecordingList
        recordings={recordings}
        loading={loading}
        isAdmin
        watchBasePath={adminPath("recordings")}
        onDownload={handleDownload}
        onDelete={handleRequestDelete}
      />

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
