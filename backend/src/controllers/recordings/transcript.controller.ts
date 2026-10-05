import type { Request, Response } from "express";
import { getRecordingById } from "../../services/recording.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, notFound } from "../../middleware/error.middleware.js";

/**
 * Get recording transcript
 * @route GET /api/recordings/:id/transcript
 */
export const getTranscript = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recording = await getRecordingById(req.params.id);

    if (!recording) {
      throw notFound("Recording not found");
    }

    if (!recording.transcript) {
      res.json({
        success: true,
        data: {
          transcript: "",
          chapters: [],
          summary: "",
          aiNotes: "",
          practiceQuestions: [],
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        transcript: recording.transcript,
        chapters: recording.chapters,
        summary: recording.summary,
        aiNotes: recording.aiNotes,
        practiceQuestions: recording.practiceQuestions,
      },
    });
  },
);
