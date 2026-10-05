import { useCallback, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import {
  getMediaLock,
  withMediaCacheBust,
  PHOTO_LOCK_DAYS,
} from "@/lib/profileMedia";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { user } from "@/types";

interface ProfileAvatarUploadProps {
  className?: string;
  overlap?: boolean;
  size?: "md" | "lg" | "xl";
  showUploader?: boolean;
  showPreview?: boolean;
}

const sizeClass = {
  md: "h-20 w-20",
  lg: "h-24 w-24 sm:h-28 sm:w-28",
  xl: "h-24 w-24 sm:h-32 sm:w-32",
} as const;

const fallbackText = {
  md: "text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-2xl sm:text-3xl",
} as const;

function getInitials(name?: string) {
  const parts = (name || "U").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
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
 * Shared profile photo uploader for student, tutor, mentor, and admin.
 * After the first upload, changes are locked for 30 days.
 */
export function ProfileAvatarUpload({
  className,
  overlap = false,
  size = "lg",
  showUploader = true,
  showPreview = true,
}: ProfileAvatarUploadProps) {
  const { user, setUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const lock = useMemo(() => {
    if (!user?.avatar) return getMediaLock(null);
    if (!user.avatarUpdatedAt) {
      return {
        locked: true,
        daysRemaining: PHOTO_LOCK_DAYS,
        nextChangeAt: null,
      };
    }
    return getMediaLock(user.avatarUpdatedAt);
  }, [user?.avatar, user?.avatarUpdatedAt]);

  const avatarSrc = useMemo(
    () => withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt),
    [user?.avatar, user?.avatarUpdatedAt],
  );

  const persistAvatar = useCallback(
    async (url: string) => {
      setSaving(true);
      try {
        const { data } = await api.put<{
          success: boolean;
          data?: { user: user };
        }>("/users/profile/avatar", { avatar: url });

        if (data?.data?.user) {
          setUser(data.data.user);
        } else {
          await refreshUser();
        }
        toast.success("Profile photo updated");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err.response?.data?.message || "Failed to update profile photo",
        );
      } finally {
        setSaving(false);
      }
    },
    [refreshUser, setUser],
  );

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onUploadError: (error) => {
      toast.error(error.message || "Failed to upload image");
    },
  });

  const busy = isUploading || saving;

  const openPicker = useCallback(() => {
    if (busy) return;
    if (lock.locked) {
      toast.error(
        `Profile photo locked. You can change it again in ${lock.daysRemaining} day${
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
        await persistAvatar(url);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to upload image";
        if (!message.toLowerCase().includes("callback")) {
          toast.error(message);
        }
      }
    },
    [lock.locked, persistAvatar, startUpload],
  );

  if (!user) return null;

  return (
    <div
      className={cn(
        showUploader && showPreview
          ? "flex w-full flex-col gap-3 sm:max-w-60"
          : showUploader
            ? "w-full"
            : "w-fit",
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

      {showPreview ? (
        <div
          className={cn(
            "relative w-fit shrink-0",
            overlap && "-mt-12 sm:-mt-16",
          )}
        >
          <button
            type="button"
            onClick={openPicker}
            disabled={busy || lock.locked}
            className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            aria-label={
              lock.locked ? "Profile photo locked" : "Upload profile photo"
            }
            title={
              lock.locked
                ? `Locked for ${lock.daysRemaining} more day${
                    lock.daysRemaining === 1 ? "" : "s"
                  }`
                : "Upload profile photo"
            }
          >
            <Avatar
              className={cn(
                sizeClass[size],
                "border-4 border-white shadow-lg ring-1 ring-slate-100 transition group-hover:ring-primary/30",
              )}
            >
              <AvatarImage src={avatarSrc} alt={user.name} />
              <AvatarFallback
                className={cn(
                  "bg-primary/10 font-black text-primary",
                  fallbackText[size],
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {busy ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </span>
            ) : lock.locked ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
                <Lock className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
                <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openPicker}
            disabled={busy || lock.locked}
            className={cn(
              "absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-md transition disabled:cursor-not-allowed",
              lock.locked
                ? "bg-slate-500"
                : "bg-slate-900 hover:bg-primary",
            )}
            aria-label={
              lock.locked ? "Profile photo locked" : "Change profile photo"
            }
            title={
              lock.locked
                ? `Locked for ${lock.daysRemaining} more day${
                    lock.daysRemaining === 1 ? "" : "s"
                  }`
                : "Change profile photo"
            }
          >
            {lock.locked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : null}

      {showUploader ? (
        <div>
          {showPreview ? (
            <p className="mb-2 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
              Profile photo
            </p>
          ) : null}
          <button
            type="button"
            onClick={openPicker}
            disabled={busy || lock.locked}
            className="flex w-full flex-col items-start rounded-xl border border-dashed border-slate-200 bg-white p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-80"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              {lock.locked ? (
                <Lock className="h-4 w-4 text-slate-500" />
              ) : (
                <Camera className="h-4 w-4 text-primary" />
              )}
              {busy
                ? "Uploading…"
                : lock.locked
                  ? "Photo locked"
                  : "Choose photo"}
            </span>
            <span className="mt-1 text-[11px] leading-snug text-slate-400">
              {lock.locked
                ? `You can change this again in ${lock.daysRemaining} day${
                    lock.daysRemaining === 1 ? "" : "s"
                  }`
                : "JPG, PNG or WebP · up to 4 MB · locked for 30 days after upload"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileAvatarUpload;
