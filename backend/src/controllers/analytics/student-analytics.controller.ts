import type { Request, Response } from "express";
import { getStudentProgress } from "../../services/analytics.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Get student progress analytics
 * @route GET /api/analytics/student/:studentId/progress
 */
export const getStudentProgressAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = Array.isArray(req.params.studentId)
      ? req.params.studentId[0]
      : req.params.studentId;

    // Check authorization — platform admins can view any student
    const isSelf = studentId === req.user!._id.toString();
    const isAdmin =
      req.user!.role === "admin" || req.user!.role === "super_admin";
    const isTutor = req.user!.role === "tutor";
    const isMentor = req.user!.role === "mentor";

    if (!isSelf && !isAdmin && !isTutor && !isMentor) {
      throw forbidden("Not authorized to view this student's analytics");
    }

    const analytics = await getStudentProgress(studentId);

    res.json({
      success: true,
      data: { analytics },
    });
  },
);
