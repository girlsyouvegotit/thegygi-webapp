import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
} from "../../services/auth.service.js";
import {
  attachTokenCookie,
  clearTokenCookie,
  generateAccessToken,
} from "../../utils/jwt.util.js";
import { logActivity } from "../../services/activity.service.js";
import { enrollStudentInCategory } from "../../services/enrollment.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
} from "../../middleware/error.middleware.js";
import mongoose from "mongoose";
import User from "../../models/user.model.js";
// Ensure Category schema is registered for populate()
import "../../models/category.model.js";
import { roleHomePath } from "../../utils/role-home.util.js";

async function userWithCategories(userId: string) {
  return User.findById(userId)
    .select("-password")
    .populate("categories", "name slug icon description")
    .populate("assignedCategories", "name slug icon description");
}

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, categoryId } = req.body;

    // Register user
    const { user, token } = await registerUser({
      name,
      email,
      password,
      categoryId,
    });

    // Auto-enroll in category if provided — never fail registration
    // just because enrollment side-effects (mentor assign / notifications) throw.
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      try {
        await enrollStudentInCategory(user._id.toString(), categoryId);
      } catch (enrollError) {
        console.error(
          "Post-registration enrollment failed:",
          enrollError instanceof Error ? enrollError.message : enrollError,
        );
      }
    }

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      action: "Registered account",
      details: `User registered with email: ${email}`,
      resourceType: "user",
      resourceId: user._id.toString(),
    });

    // Attach token to cookie
    attachTokenCookie(res, token);

    const populated = await userWithCategories(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: populated || user },
    });
  },
);

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Login user
    const { user, token } = await loginUser({ email, password });

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      action: "Logged in",
      resourceType: "user",
      resourceId: user._id.toString(),
    });

    // Attach token to cookie
    attachTokenCookie(res, token);

    const populated = await userWithCategories(user._id.toString());

    res.json({
      success: true,
      message: "Login successful",
      data: { user: populated || user },
    });
  },
);

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "Logged out",
        resourceType: "user",
        resourceId: req.user._id.toString(),
      });
    }

    // Clear token cookie
    clearTokenCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await userWithCategories(req.user!._id.toString());

    res.json({
      success: true,
      data: {
        user: user || req.user,
        impersonation: req.impersonator
          ? {
              active: true,
              mode: "act_as",
              actor: {
                _id: req.impersonator._id,
                name: req.impersonator.name,
                email: req.impersonator.email,
                role: req.impersonator.role,
              },
              home: roleHomePath(req.user!.role),
              watermark: `ACTING AS ${String(req.user!.role).toUpperCase()}`,
            }
          : null,
      },
    });
  },
);

/**
 * End act-as session and restore the originating super-admin cookie.
 * @route POST /api/auth/stop-impersonation
 */
export const stopImpersonation = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.impersonator || !req.impersonatorId) {
      throw badRequest("Not currently impersonating anyone");
    }

    const actor = req.impersonator;

    const token = generateAccessToken(String(actor._id), actor.role);
    attachTokenCookie(res, token);

    // No activity log — View as exit is silent (not shown on any dashboard).

    res.json({
      success: true,
      message: "Returned to super-admin session",
      data: {
        user: actor,
        home: roleHomePath(actor.role),
        impersonation: null,
      },
    });
  },
);
