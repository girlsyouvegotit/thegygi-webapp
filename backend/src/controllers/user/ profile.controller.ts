import type { Response } from "express";
import User from "../../models/user.model.js";
// Ensure Category schema is registered for populate()
import "../../models/category.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  notFound,
} from "../../middleware/error.middleware.js";

async function userWithCategories(userId: string) {
  return User.findById(userId)
    .select("-password")
    .populate("categories", "name slug icon description")
    .populate("assignedCategories", "name slug icon description");
}

/** Profile photo / cover can only be changed once every 30 days. */
export const PHOTO_LOCK_DAYS = 30;
const PHOTO_LOCK_MS = PHOTO_LOCK_DAYS * 24 * 60 * 60 * 1000;

export function getMediaLock(updatedAt?: Date | string | null) {
  if (!updatedAt) {
    return {
      locked: false,
      daysRemaining: 0,
      nextChangeAt: null as string | null,
    };
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

function assertCanChangeMedia(
  label: "profile photo" | "cover photo" | "chat wallpaper",
  updatedAt?: Date | null,
) {
  const lock = getMediaLock(updatedAt);
  if (!lock.locked) return;

  throw badRequest(
    `You can change your ${label} again in ${lock.daysRemaining} day${
      lock.daysRemaining === 1 ? "" : "s"
    }. Photos can only be updated every ${PHOTO_LOCK_DAYS} days.`,
  );
}

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");

    const user = await userWithCategories(req.user._id.toString());

    if (!user) throw notFound("User not found");
    res.json({ success: true, data: { user } });
  },
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");

    const { name, bio, phone, socialLinks } = req.body;
    const updates: Record<string, unknown> = { name, bio, phone };

    if (socialLinks && typeof socialLinks === "object") {
      const clean = (v: unknown) => {
        if (typeof v !== "string") return null;
        const t = v.trim();
        return t.length ? t : null;
      };
      updates.socialLinks = {
        twitter: clean(socialLinks.twitter),
        linkedin: clean(socialLinks.linkedin),
        instagram: clean(socialLinks.instagram),
        facebook: clean(socialLinks.facebook),
        website: clean(socialLinks.website),
      };
    }

    await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    const user = await userWithCategories(req.user._id.toString());

    await logActivity({
      userId: req.user._id.toString(),
      action: "Updated profile",
      resourceType: "user",
      resourceId: req.user._id.toString(),
    });

    res.json({ success: true, message: "Profile updated", data: { user } });
  },
);

export const updateAvatar = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");

    const existing = await User.findById(req.user._id).select(
      "avatar avatarUpdatedAt",
    );
    if (!existing) throw notFound("User not found");

    // Lock only after the first successful upload.
    if (existing.avatar) {
      let stampedAt = existing.avatarUpdatedAt;
      if (!stampedAt) {
        stampedAt = new Date();
        existing.avatarUpdatedAt = stampedAt;
        await existing.save();
      }
      assertCanChangeMedia("profile photo", stampedAt);
    }

    const { avatar } = req.body;
    await User.findByIdAndUpdate(
      req.user._id,
      { avatar, avatarUpdatedAt: new Date() },
      { new: true, runValidators: true },
    );

    const user = await userWithCategories(req.user._id.toString());

    await logActivity({
      userId: req.user._id.toString(),
      action: "Updated avatar",
      resourceType: "user",
      resourceId: req.user._id.toString(),
    });

    res.json({ success: true, message: "Avatar updated", data: { user } });
  },
);

export const updateCover = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");

    const existing = await User.findById(req.user._id).select(
      "coverImage coverImageUpdatedAt",
    );
    if (!existing) throw notFound("User not found");

    if (existing.coverImage) {
      let stampedAt = existing.coverImageUpdatedAt;
      if (!stampedAt) {
        stampedAt = new Date();
        existing.coverImageUpdatedAt = stampedAt;
        await existing.save();
      }
      assertCanChangeMedia("cover photo", stampedAt);
    }

    const { coverImage } = req.body;
    await User.findByIdAndUpdate(
      req.user._id,
      { coverImage, coverImageUpdatedAt: new Date() },
      { new: true, runValidators: true },
    );

    const user = await userWithCategories(req.user._id.toString());

    await logActivity({
      userId: req.user._id.toString(),
      action: "Updated cover image",
      resourceType: "user",
      resourceId: req.user._id.toString(),
    });

    res.json({
      success: true,
      message: "Cover image updated",
      data: { user },
    });
  },
);

export const getPublicProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id)
      .select("name avatar coverImage bio role socialLinks")
      .populate("categories", "name slug");
    if (!user) throw notFound("User not found");
    res.json({ success: true, data: { user } });
  },
);

const CHAT_THEME_IDS = [
  "gygi",
  "yellow",
  "red",
  "black",
  "green",
  "blue",
  "orange",
  "pink",
  "teal",
  "cyan",
  "lime",
  "brown",
  "navy",
  "gold",
  "silver",
  "crimson",
  "forest",
  "sky",
  "lavender",
  "mint",
  "burgundy",
  "charcoal",
  "peach",
  "grape",
  "ocean",
  "sunset",
  "indigo",
  "magenta",
  "olive",
  "slate",
  "rose",
  "emerald",
  "violet",
  "amber",
  "white",
] as const;

export const updateChatTheme = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");
    const theme = String(req.body.theme || "");
    if (!CHAT_THEME_IDS.includes(theme as (typeof CHAT_THEME_IDS)[number])) {
      throw badRequest("Invalid chat theme");
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { communityChatTheme: theme },
      { new: true, runValidators: true },
    );

    const user = await userWithCategories(req.user._id.toString());

    res.json({
      success: true,
      message: "Chat theme updated",
      data: { user },
    });
  },
);

const DASHBOARD_THEME_IDS = [
  "gygi-purple",
  "ultramarine",
  "soft-sky",
  "teal",
  "mint",
  "green",
  "yellow",
  "orange",
  "coral-rose",
  "red",
  "pink",
  "indigo",
  "graphite",
  "slate-blue",
  "copper",
] as const;

export const updateDashboardTheme = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");
    const theme = String(req.body.theme || "");
    if (
      !DASHBOARD_THEME_IDS.includes(
        theme as (typeof DASHBOARD_THEME_IDS)[number],
      )
    ) {
      throw badRequest("Invalid dashboard theme");
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { dashboardTheme: theme },
      { new: true, runValidators: true },
    );

    const user = await userWithCategories(req.user._id.toString());

    res.json({
      success: true,
      message: "Dashboard theme updated",
      data: { user },
    });
  },
);

export const updateChatWallpaper = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw notFound("User not found");

    const existing = await User.findById(req.user._id).select(
      "communityChatWallpaper communityChatWallpaperUpdatedAt",
    );
    if (!existing) throw notFound("User not found");

    if (existing.communityChatWallpaper) {
      let stampedAt = existing.communityChatWallpaperUpdatedAt;
      if (!stampedAt) {
        stampedAt = new Date();
        existing.communityChatWallpaperUpdatedAt = stampedAt;
        await existing.save();
      }
      assertCanChangeMedia("chat wallpaper", stampedAt);
    }

    const wallpaper = String(req.body.wallpaper || "").trim();
    if (!wallpaper) throw badRequest("Wallpaper URL is required");

    await User.findByIdAndUpdate(
      req.user._id,
      {
        communityChatWallpaper: wallpaper,
        communityChatWallpaperUpdatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    const user = await userWithCategories(req.user._id.toString());

    await logActivity({
      userId: req.user._id.toString(),
      action: "Updated community chat wallpaper",
      resourceType: "user",
      resourceId: req.user._id.toString(),
    });

    res.json({
      success: true,
      message: "Chat wallpaper updated. You can change it again in 30 days.",
      data: {
        user,
        lock: getMediaLock(new Date()),
      },
    });
  },
);
