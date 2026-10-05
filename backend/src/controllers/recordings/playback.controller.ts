import type { Request, Response } from "express";
import {
  getRecordingById,
  incrementDownloadCount,
  isRecordingPlayable,
} from "../../services/recording.service.js";
import { storageService } from "../../services/storage.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Get playback URL (temporary)
 * @route GET /api/recordings/:id/play
 */
export const getPlaybackUrl = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const recording = await getRecordingById(recordingId);

    if (!recording) {
      throw notFound("Recording not found");
    }

    if (!isRecordingPlayable(recording)) {
      throw badRequest("Recording is not available to watch yet");
    }

    if (!recording.storageUrl) {
      throw badRequest("Recording file is missing");
    }

    let playbackUrl: string;

    if (storageService.isLocalRecordingRef(recording.storageUrl)) {
      // Stream through our authenticated API (cookie auth works on same host)
      const host = req.get("host") || `localhost:${process.env.PORT || 5000}`;
      const protocol = req.protocol || "http";
      playbackUrl = `${protocol}://${host}/api/recordings/${recordingId}/stream`;
    } else {
      try {
        playbackUrl = await storageService.generateTemporaryUrl(
          recording.storageUrl,
        );
      } catch (error) {
        console.error("[playback] failed to sign UploadThing URL:", error);
        throw badRequest(
          error instanceof Error
            ? error.message
            : "Failed to generate playback URL",
        );
      }
    }

    res.json({
      success: true,
      data: { playbackUrl },
    });
  },
);

/**
 * Stream recording (protected)
 * @route GET /api/recordings/:id/stream
 */
export const streamRecording = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const recording = await getRecordingById(recordingId);

    if (!recording) {
      throw notFound("Recording not found");
    }

    if (!isRecordingPlayable(recording)) {
      throw badRequest("Recording is not available to watch yet");
    }

    // Check if file exists
    const exists = await storageService.fileExists(recording.storageUrl);
    if (!exists) {
      throw notFound("Recording file not found");
    }

    // Stream file
    const stream = storageService.createReadStream(recording.storageUrl);
    res.setHeader("Content-Type", "video/webm");
    stream.pipe(res);
  },
);

/**
 * Download recording (admin only)
 * @route GET /api/recordings/:id/download
 */
export const downloadRecording = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const recording = await getRecordingById(recordingId);

    if (!recording) {
      throw notFound("Recording not found");
    }

    // Increment download count
    await incrementDownloadCount(recordingId, req.user!._id.toString());

    // Generate download URL
    const downloadUrl = await storageService.generateDownloadUrl(
      recording.storageUrl,
    );

    const classTitle =
      recording.classId &&
      typeof recording.classId === "object" &&
      "title" in recording.classId
        ? String((recording.classId as { title?: string }).title || "")
        : undefined;

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Downloaded recording",
      details: `Downloaded recording ID: ${recordingId}`,
      resourceType: "recording",
      resourceId: recordingId,
      metadata: {
        recordingTitle: classTitle,
        timestamp: new Date(),
      },
    });

    res.json({
      success: true,
      data: { downloadUrl },
    });
  },
);
