import { useCallback, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { getMediaLock, withMediaCacheBust, PHOTO_LOCK_DAYS } from "@/lib/profileMedia";
import type { user } from "@/types";

interface ProfileCoverUploadProps {
  className?: string;
  fallbackGradientClassName?: string;
}

function pickFileUrl(
  file:
    | {
        url?: string;
        ufsUrl?: string;
        serverData?: { url?: string } | null;
      }
    | undefined,
) {
  return file?.serverData?.url || file?.ufsUrl || file?.url || "";
}

/**
 * Twitter/LinkedIn-style cover banner with click-to-upload.
 * After the first upload, changes are locked for 30 days.
 */
export function ProfileCoverUpload({
  className,
  fallbackGradientClassName = "from-primary via-[#A855F7] to-[#7C3AED]",
}: ProfileCoverUploadProps) {
  const { user, setUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lock = useMemo(() => {
    if (!user?.coverImage) return getMediaLock(null);
    if (!user.coverImageUpdatedAt) {
      return {
        locked: true,
        daysRemaining: PHOTO_LOCK_DAYS,
        nextChangeAt: null,
      };
    }
    return getMediaLock(user.coverImageUpdatedAt);
  }, [user?.coverImage, user?.coverImageUpdatedAt]);

  const coverUrl = useMemo(
    () => withMediaCacheBust(user?.coverImage, user?.coverImageUpdatedAt),
    [user?.coverImage, user?.coverImageUpdatedAt],
  );

  const persistCover = useCallback(
    async (url: string) => {
      setSaving(true);
      try {
        const { data } = await api.put<{
          success: boolean;
          data?: { user: user };
        }>("/users/profile/cover", { coverImage: url });

        if (data?.data?.user) {
          setUser(data.data.user);
        } else {
          await refreshUser();
        }
        toast.success("Cover photo updated");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err.response?.data?.message || "Failed to update cover photo",
        );
      } finally {
        setSaving(false);
      }
    },
    [refreshUser, setUser],
  );

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onUploadError: (error) => {
      toast.error(error.message || "Failed to upload cover photo");
    },
  });

  const busy = isUploading || saving;

  const openPicker = useCallback(() => {
    if (busy) return;
    if (lock.locked) {
      toast.error(
        `Cover photo locked. You can change it again in ${lock.daysRemaining} day${
          lock.daysRemaining === 1 ? "" : "s"
        }.`,
      );
      return;
    }
    inputRef.current?.click();
  }, [busy, lock]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || lock.locked) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image must be 4 MB or smaller");
        return;
      }

      try {
        const uploaded = await startUpload([file]);
        const url = pickFileUrl(uploaded?.[0]);
        if (!url) {
          toast.error("Upload finished but no image URL was returned");
          return;
        }
        await persistCover(url);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to upload cover";
        if (!message.toLowerCase().includes("callback")) {
          toast.error(message);
        }
      }
    },
    [lock.locked, persistCover, startUpload],
  );

  return (
    <div
      className={cn(
        "group relative h-36 overflow-hidden sm:h-44 lg:h-52",
        !coverUrl && `bg-gradient-to-br ${fallbackGradientClassName}`,
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void onFileChange(e)}
        tabIndex={-1}
        disabled={lock.locked}
      />

      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_40%)]" />
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10 blur-2xl sm:h-48 sm:w-48" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />

      <button
        type="button"
        onClick={openPicker}
        disabled={busy || lock.locked}
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center transition",
          lock.locked
            ? "cursor-not-allowed bg-black/0"
            : "bg-black/0 hover:bg-black/35 focus-visible:bg-black/35",
          "focus-visible:outline-none disabled:cursor-not-allowed",
        )}
        aria-label={lock.locked ? "Cover photo locked" : "Upload cover photo"}
        title={
          lock.locked
            ? `Locked for ${lock.daysRemaining} more day${
                lock.daysRemaining === 1 ? "" : "s"
              }`
            : "Upload cover photo"
        }
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition",
            lock.locked
              ? "opacity-100"
              : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
            busy && "opacity-100",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : lock.locked ? (
            <>
              <Lock className="h-4 w-4" />
              Locked · {lock.daysRemaining}d left
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {coverUrl ? "Change cover" : "Add cover photo"}
            </>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={openPicker}
        disabled={busy || lock.locked}
        className={cn(
          "absolute right-3 bottom-3 z-20 flex h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition disabled:cursor-not-allowed sm:right-4 sm:bottom-4",
          lock.locked
            ? "bg-black/40"
            : "bg-black/50 hover:bg-black/70",
        )}
        aria-label={lock.locked ? "Cover photo locked" : "Edit cover photo"}
      >
        {lock.locked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        <span className="hidden min-[400px]:inline">
          {lock.locked ? `${lock.daysRemaining}d lock` : "Edit cover"}
        </span>
      </button>
    </div>
  );
}

export default ProfileCoverUpload;
