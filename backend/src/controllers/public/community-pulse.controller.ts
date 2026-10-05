import type { Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { getCommunityPulse } from "../../services/community-pulse.service.js";
import type { Request } from "express";

/**
 * Public community pulse for marketing / home dashboard
 * @route GET /api/public/community-pulse
 */
export const getPublicCommunityPulse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

    const pulse = await getCommunityPulse(categoryId);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      data: { pulse },
    });
  },
);
