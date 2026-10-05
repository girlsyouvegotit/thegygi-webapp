import type { Request, Response } from "express";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// In-memory settings (replace with database model in production)
let schoolSettings = {
  name: "GYGI",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo: "",
  primaryColor: "#c147e9",
};

/**
 * Get school settings
 * @route GET /api/settings/school
 */
export const getSchoolSettings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    res.json({
      success: true,
      data: schoolSettings,
    });
  },
);

/**
 * Update school settings
 * @route PUT /api/settings/school
 */
export const updateSchoolSettings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    schoolSettings = { ...schoolSettings, ...req.body };

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated school settings",
      resourceType: "settings",
    });

    res.json({
      success: true,
      message: "Settings updated",
      data: schoolSettings,
    });
  },
);
