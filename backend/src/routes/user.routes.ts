import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  changeUserRole,
  createWriter,
  resetUserPassword,
} from "../controllers/user/user.controller.js";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  getPublicProfile,
  updateChatTheme,
  updateChatWallpaper,
  updateDashboardTheme,
} from "../controllers/user/ profile.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  adminOnly,
  tutorOrAdmin,
  anyAuthenticated,
} from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z
    .enum(["student", "tutor", "mentor", "writer", "admin", "super_admin"])
    .optional(),
  isActive: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
});

const optionalUrl = z.union([
  z.string().url().max(200),
  z.literal(""),
  z.null(),
]);

const socialLinksSchema = z
  .object({
    twitter: optionalUrl.optional(),
    linkedin: optionalUrl.optional(),
    instagram: optionalUrl.optional(),
    facebook: optionalUrl.optional(),
    website: optionalUrl.optional(),
  })
  .optional();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  socialLinks: socialLinksSchema,
});

const updateAvatarSchema = z.object({
  avatar: z.string().min(1, "Avatar URL is required"),
});

const updateCoverSchema = z.object({
  coverImage: z.string().min(1, "Cover image URL is required"),
});

const updateChatThemeSchema = z.object({
  theme: z.enum([
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
  ]),
});

const updateChatWallpaperSchema = z.object({
  wallpaper: z.string().min(1, "Wallpaper URL is required"),
});

const updateDashboardThemeSchema = z.object({
  theme: z.enum([
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
  ]),
});

const changeRoleSchema = z.object({
  role: z.enum(["student", "tutor", "mentor", "writer", "admin", "super_admin"]),
  /** Required by the controller when promoting a non-mentor to mentor */
  categoryId: z.string().min(1).optional(),
  maxMentees: z.number().min(1).max(50).optional(),
});

const createWriterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  /** Optional custom password; otherwise a temporary password is generated */
  password: z.string().min(8).max(72).optional(),
});

// All user routes require authentication
router.use(protect);

// Profile routes (any authenticated user)
router.get("/profile", getProfile);
router.put("/profile", validateBody(updateProfileSchema), updateProfile);
router.put("/profile/avatar", validateBody(updateAvatarSchema), updateAvatar);
router.put("/profile/cover", validateBody(updateCoverSchema), updateCover);
router.put(
  "/profile/chat-theme",
  validateBody(updateChatThemeSchema),
  updateChatTheme,
);
router.put(
  "/profile/chat-wallpaper",
  validateBody(updateChatWallpaperSchema),
  updateChatWallpaper,
);
router.put(
  "/profile/dashboard-theme",
  validateBody(updateDashboardThemeSchema),
  updateDashboardTheme,
);
router.get("/profile/:id", getPublicProfile);

// Admin routes
router.get("/", adminOnly, getUsers);
router.post(
  "/writers",
  adminOnly,
  validateBody(createWriterSchema),
  createWriter,
);
router.get("/:id", adminOnly, getUserById);
router.put("/:id", adminOnly, validateBody(updateUserSchema), updateUser);
router.delete("/:id", adminOnly, deleteUser);
router.put("/:id/suspend", adminOnly, suspendUser);
router.put("/:id/activate", adminOnly, activateUser);
router.put(
  "/:id/password",
  adminOnly,
  validateBody(
    z.object({
      password: z.string().min(8).max(72).optional(),
    }),
  ),
  resetUserPassword,
);
router.put(
  "/:id/role",
  adminOnly,
  validateBody(changeRoleSchema),
  changeUserRole,
);

export default router;
