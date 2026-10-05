import type { Response } from "express";
import {
  getAdminOverview,
  getAllStudentsPerformance,
} from "../../services/analytics.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

/**
 * Get platform overview analytics (admin only)
 * @route GET /api/analytics/admin/overview
 */
export const getPlatformOverview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const overview = await getAdminOverview();

    res.json({
      success: true,
      data: { overview },
    });
  },
);

/**
 * Get all students' performance across categories/courses (admin / super_admin)
 * @route GET /api/analytics/admin/students-performance
 */
export const getStudentsPerformance = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await getAllStudentsPerformance({ categoryId, search });

    res.json({
      success: true,
      data: result,
    });
  },
);
