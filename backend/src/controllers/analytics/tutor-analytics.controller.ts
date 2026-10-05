import type { Response } from "express";
import {
  getTutorAnalytics,
  getTutorStudents,
} from "../../services/analytics.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, forbidden } from "../../middleware/error.middleware.js";

const assertTutorAccess = (req: AuthRequest, tutorId: string) => {
  const isSelf = tutorId === req.user!._id.toString();
  const isAdmin = req.user!.role === "admin";
  if (!isSelf && !isAdmin) {
    throw forbidden("Not authorized to view this tutor's analytics");
  }
};

/**
 * Get tutor performance analytics
 * @route GET /api/analytics/tutor/:tutorId
 */
export const getTutorPerformanceAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { tutorId } = req.params;
    assertTutorAccess(req, tutorId as string);

    const analytics = await getTutorAnalytics(tutorId as string);

    res.json({
      success: true,
      data: { analytics },
    });
  },
);

/**
 * List students enrolled in a tutor's categories
 * @route GET /api/analytics/tutor/:tutorId/students
 */
export const getTutorStudentRoster = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { tutorId } = req.params;
    assertTutorAccess(req, tutorId as string);

    const students = await getTutorStudents(tutorId as string);

    res.json({
      success: true,
      data: { students },
    });
  },
);
