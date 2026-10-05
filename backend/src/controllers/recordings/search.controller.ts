import type { Request, Response } from "express";
import { searchTranscript } from "../../services/recording.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, badRequest } from "../../middleware/error.middleware.js";

/**
 * Search within recording transcript
 * @route GET /api/recordings/:id/search?q=query
 */
export const searchRecording = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      throw badRequest("Search query must be at least 2 characters");
    }

    const results = await searchTranscript(id, q);

    res.json({
      success: true,
      data: { results },
    });
  },
);
