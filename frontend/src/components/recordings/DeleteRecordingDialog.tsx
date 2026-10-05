import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingTitle?: string;
  loading?: boolean;
  onConfirm: (password: string) => Promise<void> | void;
}

const DeleteRecordingDialog = ({
  open,
  onOpenChange,
  recordingTitle,
  loading = false,
  onConfirm,
}: DeleteRecordingDialogProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Enter your password to continue");
      return;
    }
    setError(null);
    try {
      await onConfirm(password);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete recording";
      setError(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="space-y-3 border-b border-rose-100 bg-rose-50/70 px-5 py-5 text-left sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete recording?
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-600">
              This permanently removes the class recording
              {recordingTitle ? (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-slate-800">
                    {recordingTitle}
                  </span>
                </>
              ) : null}
              . Students will no longer be able to watch it.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            Confirm you are sure, then enter your admin password to authorize
            deletion. This cannot be undone.
          </p>

          <div className="space-y-2">
            <Label
              htmlFor="delete-recording-password"
              className="text-sm font-semibold text-slate-700"
            >
              Your password
            </Label>
            <div className="relative">
              <Input
                id="delete-recording-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleConfirm();
                  }
                }}
                className="h-11 rounded-xl border-slate-200 pr-11 text-base sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-sm text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-11 w-full rounded-full sm:flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading || !password.trim()}
            className="h-11 w-full rounded-full sm:flex-1"
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete recording
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRecordingDialog;
