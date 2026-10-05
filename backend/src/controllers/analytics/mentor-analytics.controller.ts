import type { Request, Response } from "express";
import { getMentorAnalytics } from "../../services/analytics.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, forbidden } from "../../middleware/error.middleware.js";

/**
 * Get mentor impact analytics
 * @route GET /api/analytics/mentor/:mentorId
 */
export const getMentorImpactAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId } = req.params;

    // Check authorization
    const isSelf = mentorId === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";

    if (!isSelf && !isAdmin) {
      throw forbidden("Not authorized to view this mentor's analytics");
    }

    const analytics = await getMentorAnalytics(mentorId as string);

    res.json({
      success: true,
      data: { analytics },
    });
  },
);
