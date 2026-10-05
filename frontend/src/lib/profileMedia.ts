/** Profile photo / cover can only be changed once every 30 days. */
export const PHOTO_LOCK_DAYS = 30;
const PHOTO_LOCK_MS = PHOTO_LOCK_DAYS * 24 * 60 * 60 * 1000;

export type MediaLockInfo = {
  locked: boolean;
  daysRemaining: number;
  nextChangeAt: string | null;
};

export function getMediaLock(
  updatedAt?: string | Date | null,
): MediaLockInfo {
  if (!updatedAt) {
    return { locked: false, daysRemaining: 0, nextChangeAt: null };
  }

  const since = new Date(updatedAt);
  if (Number.isNaN(since.getTime())) {
    return { locked: false, daysRemaining: 0, nextChangeAt: null };
  }

  const unlockAt = new Date(since.getTime() + PHOTO_LOCK_MS);
  const remainingMs = unlockAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    return { locked: false, daysRemaining: 0, nextChangeAt: null };
  }

  return {
    locked: true,
    daysRemaining: Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))),
    nextChangeAt: unlockAt.toISOString(),
  };
}

/** Bust CDN/browser cache when avatar/cover timestamps change. */
export function withMediaCacheBust(
  url?: string | null,
  updatedAt?: string | Date | null,
) {
  if (!url) return undefined;
  if (!updatedAt) return url;
  const ts = new Date(updatedAt).getTime();
  if (Number.isNaN(ts)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${ts}`;
}

export function profilePathForRole(role?: string) {
  switch (role) {
    case "tutor":
      return "/tutor/profile";
    case "mentor":
      return "/mentor/profile";
    case "admin":
      return "/admin/profile";
    case "super_admin":
      return "/super-admin/dashboard";
    case "student":
    default:
      return "/profile";
  }
}
