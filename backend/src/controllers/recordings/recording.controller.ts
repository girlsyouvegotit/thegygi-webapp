import type { Response } from "express";
import {
  getRecordingById,
  getRecordingsByCategory,
  listRecordings,
  deleteRecording as deleteRecordingService,
  incrementViewCount,
} from "../../services/recording.service.js";
import LiveSession from "../../models/live-session.model.js";
import User from "../../models/user.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  badRequest,
  unauthorized,
} from "../../middleware/error.middleware.js";
import { hasRole } from "../../middleware/role.middleware.js";

/**
 * Get all recordings (role-based)
 * @route GET /api/recordings
 */
export const getAllRecordings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page = 1, limit = 10, categoryId } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 10));
    const categoryFilter =
      typeof categoryId === "string" && categoryId.trim()
        ? categoryId.trim()
        : undefined;

    let recordings: Awaited<ReturnType<typeof listRecordings>>["recordings"] =
      [];
    let total = 0;

    if (hasRole(req.user, ["admin"])) {
      // Admin + super_admin see all recordings (optionally filtered by category)
      const result = await listRecordings({
        categoryId: categoryFilter,
        page: pageNum,
        limit: limitNum,
        readyOnly: false,
      });
      recordings = result.recordings;
      total = result.total;
    } else if (req.user!.role === "tutor") {
      // Tutor sees own recordings (including still-processing uploads)
      const result = await listRecordings({
        tutorId: req.user!._id.toString(),
        page: pageNum,
        limit: limitNum,
        readyOnly: false,
        availableOnly: true,
      });
      recordings = result.recordings;
      total = result.total;
    } else if (req.user!.role === "student") {
      // Student sees uploaded recordings from enrolled categories
      const categoryIds = (req.user!.categories || []).map((c) =>
        typeof c === "string" ? c : String((c as { _id?: unknown })._id ?? c),
      );

      if (categoryFilter) {
        if (!categoryIds.includes(categoryFilter)) {
          recordings = [];
          total = 0;
        } else {
          const result = await getRecordingsByCategory(
            categoryFilter,
            pageNum,
            limitNum,
          );
          recordings = result.recordings;
          total = result.total;
        }
      } else if (categoryIds.length === 0) {
        recordings = [];
        total = 0;
      } else {
        const result = await listRecordings({
          categoryIds,
          page: pageNum,
          limit: limitNum,
          readyOnly: false,
          availableOnly: true,
        });
        recordings = result.recordings;
        total = result.total;
      }
    } else {
      recordings = [];
      total = 0;
    }

    res.json({
      success: true,
      data: { recordings },
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  },
);

/**
 * Get recording by ID
 * @route GET /api/recordings/:id
 */
export const getRecordingByIdHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const recording = await getRecordingById(recordingId);

    if (!recording) {
      throw notFound("Recording not found");
    }

    // Increment view count
    await incrementViewCount(recordingId);

    res.json({
      success: true,
      data: { recording },
    });
  },
);

/**
 * Class chat / interactions captured during the live session.
 * @route GET /api/recordings/:id/chat
 */
export const getRecordingChat = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const recording = req.recording ?? (await getRecordingById(recordingId));

    if (!recording) {
      throw notFound("Recording not found");
    }

    const session = await LiveSession.findById(recording.sessionId).select(
      "chatMessages startedAt",
    );

    const anchor =
      recording.recordingStartedAt || session?.startedAt || recording.date;
    const anchorMs = new Date(anchor).getTime();

    const messages = (session?.chatMessages || []).map((msg) => {
      const ts = new Date(msg.timestamp).getTime();
      const offsetSeconds = Number.isFinite(ts)
        ? Math.max(0, Math.round((ts - anchorMs) / 1000))
        : 0;
      return {
        userId: msg.userId?.toString?.() ?? String(msg.userId),
        userName: msg.userName,
        message: msg.message,
        timestamp: msg.timestamp,
        type: msg.type || "text",
        metadata: msg.metadata || null,
        offsetSeconds,
      };
    });

    res.json({
      success: true,
      data: {
        messages,
        startedAt: anchor,
      },
    });
  },
);

/**
 * Delete recording (admin) — requires the admin's account password.
 * @route DELETE /api/recordings/:id
 * @body { password: string }
 */
export const deleteRecording = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recordingId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const password =
      typeof req.body?.password === "string" ? req.body.password.trim() : "";
    if (!password) {
      throw badRequest("Password is required to delete a recording");
    }

    const admin = await User.findById(req.user!._id).select("+password");
    if (!admin) {
      throw unauthorized("Not authorized");
    }

    const passwordOk = await admin.matchPassword(password);
    if (!passwordOk) {
      throw unauthorized("Incorrect password");
    }

    const recording = await getRecordingById(recordingId);
    if (!recording) {
      throw notFound("Recording not found");
    }

    await deleteRecordingService(recordingId);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted recording",
      details: `Deleted recording ID: ${recordingId}`,
      resourceType: "recording",
      resourceId: recordingId,
    });

    res.json({
      success: true,
      message: "Recording deleted",
    });
  },
);
