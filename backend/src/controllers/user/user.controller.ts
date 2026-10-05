import type { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../../models/user.model.js";
import { UserRole } from "../../models/user.model.js";
import Category from "../../models/category.model.js";
import { addMentorToCategory } from "../../services/category.service.js";
import { createMentorAssignment } from "../../services/mentor-assignment.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  badRequest,
  conflict,
} from "../../middleware/error.middleware.js";
import {
  getPaginationParams,
  getPaginationResponse,
} from "../../utils/pagination.util.js";

function generateTemporaryPassword(length = 12): string {
  // Alphanumeric only — avoids copy/paste issues with symbols
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Hash + store password via updateOne so the pre-save hook cannot double-hash. */
async function setUserPasswordDirect(
  userId: string,
  plainPassword: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const hashed = await bcrypt.hash(plainPassword, 10);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        password: hashed,
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0,
        ...extra,
      },
      $unset: { lockedUntil: 1 },
    },
  );
  const stored = await User.findById(userId).select("+password");
  const ok = stored
    ? await bcrypt.compare(plainPassword, stored.password)
    : false;
  if (!ok) {
    throw badRequest("Failed to set a usable password. Please try again.");
  }
}

const ALLOWED_USER_FIELDS = [
  "name",
  "email",
  "role",
  "isActive",
  "bio",
  "phone",
  "avatar",
] as const;

const pickAllowed = (body: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_USER_FIELDS) {
    if (key in body) out[key] = body[key];
  }
  return out;
};

export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);
    const { role, search, isActive } = req.query;

    const filter: Record<string, unknown> = {};
    const actorRole = req.user!.role;

    // Regular admins never see Super accounts
    if (actorRole === "admin") {
      if (role === "super_admin") {
        res.json({
          success: true,
          data: { users: [] },
          pagination: getPaginationResponse(0, page, limit),
        });
        return;
      }
      if (role && role !== "all" && role !== "") {
        filter.role = role;
      } else {
        filter.role = { $ne: "super_admin" };
      }
    } else if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("categories", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, 200))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          _id: String(u._id),
        })),
      },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("categories", "name slug");
    if (!user) throw notFound("User not found");
    if (req.user!.role === "admin" && user.role === "super_admin") {
      throw notFound("User not found");
    }
    res.json({ success: true, data: { user } });
  },
);

/**
 * Create a writer account (no learning category / enrollment).
 * Returns a one-time temporary password for the admin to share.
 */
export const createWriter = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (trimmedName.length < 2) throw badRequest("Name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw badRequest("Valid email is required");
    }

    const existing = await User.findOne({ email: trimmedEmail }).select("_id");
    if (existing) throw conflict("A user with this email already exists");

    const temporaryPassword =
      password && String(password).length >= 8
        ? String(password)
        : generateTemporaryPassword(12);

    // Placeholder password satisfies schema; we overwrite via direct hash next.
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: temporaryPassword,
      role: UserRole.WRITER,
      isActive: true,
      categories: [],
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await setUserPasswordDirect(String(user._id), temporaryPassword);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created writer",
      details: `Created writer account for ${trimmedEmail}`,
      resourceType: "user",
      resourceId: String(user._id),
      isAudit: true,
    });

    const safeUser = await User.findById(user._id).select("-password").lean();

    res.status(201).json({
      success: true,
      message: "Writer account created",
      data: {
        user: safeUser
          ? { ...safeUser, _id: String(safeUser._id) }
          : null,
        temporaryPassword,
        email: trimmedEmail,
      },
    });
  },
);

/**
 * Admin: set a new temporary password for a user (shown once in the response).
 */
export const resetUserPassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound("User not found");
    if (req.user!.role === "admin" && user.role === "super_admin") {
      throw notFound("User not found");
    }

    const requested = String(req.body?.password || "");
    const temporaryPassword =
      requested.length >= 8 ? requested : generateTemporaryPassword(12);

    await setUserPasswordDirect(String(user._id), temporaryPassword, {
      isActive: true,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Reset user password",
      details: `Reset password for ${user.email}`,
      resourceType: "user",
      resourceId: String(user._id),
      isAudit: true,
    });

    res.json({
      success: true,
      message: "Password reset",
      data: {
        temporaryPassword,
        email: user.email,
      },
    });
  },
);

export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound("User not found");

    const update = pickAllowed(req.body as Record<string, unknown>);

    if (
      req.params.id === req.user!._id.toString() &&
      update.role &&
      update.role !== user.role
    ) {
      throw badRequest("Cannot change your own role");
    }

    if (
      update.role &&
      !Object.values(UserRole).includes(update.role as UserRole)
    ) {
      throw badRequest("Invalid role");
    }

    if (req.user!.role === "admin") {
      if (user.role === "super_admin") {
        throw notFound("User not found");
      }
      if (update.role === "super_admin") {
        throw badRequest("Cannot assign Super role");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated user",
      details: `Updated user: ${updatedUser?.email}`,
      resourceType: "user",
      resourceId: String(req.params.id),
    });

    res.json({
      success: true,
      message: "User updated",
      data: { user: updatedUser },
    });
  },
);

export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound("User not found");
    if (user._id.toString() === req.user!._id.toString()) {
      throw badRequest("Cannot delete your own account");
    }
    if (req.user!.role === "admin" && user.role === "super_admin") {
      throw notFound("User not found");
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted user",
      details: `Deleted user: ${user.email}`,
      resourceType: "user",
      resourceId: String(req.params.id),
      isAudit: true,
    });

    res.json({ success: true, message: "User deleted" });
  },
);

export const suspendUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const existing = await User.findById(req.params.id).select("role email");
    if (!existing) throw notFound("User not found");
    if (req.user!.role === "admin" && existing.role === "super_admin") {
      throw notFound("User not found");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ).select("-password");
    if (!user) throw notFound("User not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Suspended user",
      details: `Suspended user: ${user.email}`,
      resourceType: "user",
      resourceId: String(req.params.id),
      isAudit: true,
    });

    res.json({ success: true, message: "User suspended", data: { user } });
  },
);

export const activateUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    ).select("-password");
    if (!user) throw notFound("User not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Activated user",
      details: `Activated user: ${user.email}`,
      resourceType: "user",
      resourceId: String(req.params.id),
      isAudit: true,
    });

    res.json({ success: true, message: "User activated", data: { user } });
  },
);

/**
 * Change user role.
 *
 * When the role changes we also migrate the user's category association
 * between the role-specific arrays on the Category document. The user's
 * `categories` field is preserved — it is the source of truth for which
 * categories this user belongs to. The Category-side arrays are a
 * denormalized read model that tutor/mentor/student queries rely on, so
 * they must be kept in sync.
 */
export const changeUserRole = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { role, categoryId, maxMentees } = req.body as {
      role: unknown;
      categoryId?: string;
      maxMentees?: number;
    };
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      throw badRequest("Invalid role");
    }
    if (req.params.id === req.user!._id.toString()) {
      throw badRequest("Cannot change your own role");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw notFound("User not found");

    const previousRole = user.role;
    const nextRole = role as UserRole;
    const promotingToMentor =
      nextRole === "mentor" && previousRole !== "mentor";

    if (promotingToMentor && !categoryId) {
      throw badRequest(
        "Select a category to assign this mentor to before promoting",
      );
    }

    if (previousRole !== nextRole) {
      const categoryIds = (user.categories || []).map((c) => c.toString());

      if (categoryIds.length > 0) {
        // Remove from every role array the user might currently be in.
        await Category.updateMany(
          { _id: { $in: categoryIds } },
          {
            $pull: {
              students: user._id,
              tutors: user._id,
              mentors: user._id,
            },
          },
        );

        // Add to the array matching the new role.
        // Writers/admins are not tracked per-category.
        const addKey =
          nextRole === "student"
            ? "students"
            : nextRole === "tutor"
              ? "tutors"
              : nextRole === "mentor"
                ? "mentors"
                : null;

        if (addKey) {
          await Category.updateMany(
            { _id: { $in: categoryIds } },
            { $addToSet: { [addKey]: user._id } },
          );
        }
      }

      user.role = nextRole;
      // Writers don't belong to learning categories
      if (nextRole === "writer" || nextRole === "admin" || nextRole === "super_admin") {
        user.categories = [];
      }
      await user.save();
    }

    // Promoting to mentor: attach to the chosen category + create capacity shell
    if (promotingToMentor && categoryId) {
      const category = await Category.findById(categoryId).select("_id name");
      if (!category) throw notFound("Category not found");

      await addMentorToCategory(categoryId, user._id.toString());
      try {
        await createMentorAssignment(
          user._id.toString(),
          categoryId,
          maxMentees || 10,
        );
      } catch (err: unknown) {
        // Already assigned to this category is fine on re-promote paths
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "";
        if (!/already assigned/i.test(message)) throw err;
      }
    }

    const updatedUser = await User.findById(req.params.id).select("-password");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Changed user role",
      details: `Changed user ${updatedUser?.email} role from ${previousRole} to ${nextRole}${
        promotingToMentor && categoryId
          ? ` and assigned to category ${categoryId}`
          : ""
      }`,
      resourceType: "user",
      resourceId: String(req.params.id),
      metadata: {
        previousRole,
        newRole: nextRole,
        categoryId: promotingToMentor ? categoryId : undefined,
      },
      isAudit: true,
    });

    res.json({
      success: true,
      message: promotingToMentor
        ? "User promoted to mentor and assigned to category"
        : "User role changed",
      data: { user: updatedUser },
    });
  },
);