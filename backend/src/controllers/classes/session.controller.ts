import type { Response } from "express";
import LiveClass from "../../models/live-class.model.js";
import LiveSession from "../../models/live-session.model.js";
import Category from "../../models/category.model.js";
import Recording from "../../models/recording.model.js";
import { createRecordingRecord } from "../../services/recording.service.js";
import { logActivity } from "../../services/activity.service.js";
import { inngest } from "../../inngest/client.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Helper — decides if the given user is allowed to access a class's category.
 * - admin: always
 * - tutor assigned to the category (via Category.tutors OR User.categories): yes
 * - mentor assigned to the category: yes
 * - student enrolled in the category: yes
 * - everyone else: no
 */
const canAccessCategory = async (
  userId: string,
  role: string,
  categoryId: string,
  userCategories: unknown[] | undefined,
): Promise<boolean> => {
  if (role === "admin") return true;

  // Students: check their own `categories` list (fast path, no DB hit).
  if (role === "student") {
    return (userCategories ?? []).some(
      (c) => c?.toString() === categoryId.toString(),
    );
  }

  // Tutors and mentors: verify assignment in the category document.
  if (role === "tutor" || role === "mentor") {
    const query =
      role === "tutor"
        ? { _id: categoryId, tutors: userId }
        : { _id: categoryId, mentors: userId };
    const cat = await Category.findOne(query).select("_id");
    if (cat) return true;

    // Fallback for tutors promoted from student: they are in their own
    // `User.categories` array but may not yet be in `Category.tutors`.
    return (userCategories ?? []).some(
      (c) => c?.toString() === categoryId.toString(),
    );
  }

  return false;
};

/**
 * Human-readable scheduled-time label for error messages.
 */
const formatScheduledTime = (date: Date): string =>
  date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Start a class (create live session)
 * @route POST /api/classes/:id/start
 *
 * Rules:
 * - Admin bypasses the scheduled-time gate (break-glass).
 * - Tutor can only start at or after the class's scheduled time. Enforced
 *   server-side — a manually crafted request cannot bypass it.
 * - Status must be `scheduled` (not live, ended, processing, or cancelled).
 */
export const startClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to start this class");
    }

    if (liveClass.status === "live") {
      throw badRequest("Class is already live");
    }

    if (liveClass.status === "ended" || liveClass.status === "recorded") {
      throw badRequest("Class has already ended");
    }

    if (liveClass.status === "processing") {
      throw badRequest("Class is being processed");
    }

    if (liveClass.status === "cancelled") {
      throw badRequest("Class was cancelled");
    }

    // Scheduled-time gate. Admins bypass; tutors do not.
    if (req.user!.role !== "admin") {
      const now = new Date();
      const scheduled = new Date(liveClass.scheduledDate);
      if (now.getTime() < scheduled.getTime()) {
        throw badRequest(
          `This class is scheduled for ${formatScheduledTime(
            scheduled,
          )}. It cannot be started until that time.`,
        );
      }
    }

    const session = await LiveSession.create({
      classId: liveClass._id,
      tutor: liveClass.tutor,
      category: liveClass.category,
      startedAt: new Date(),
      status: "live",
    });

    liveClass.status = "live";
    liveClass.sessionId = session._id;
    await liveClass.save();

    if (liveClass.isRecordable) {
      await createRecordingRecord(
        liveClass._id.toString(),
        session._id.toString(),
        liveClass.category.toString(),
        liveClass.tutor.toString(),
      );
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Started class",
      details: `Started class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.json({
      success: true,
      message: "Class started",
      data: { session },
    });
  },
);

export const endClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to end this class");
    }

    // Idempotent — already closed rooms should not throw
    if (
      liveClass.status === "ended" ||
      liveClass.status === "processing" ||
      liveClass.status === "recorded"
    ) {
      res.json({
        success: true,
        message: "Class already ended",
        data: { status: liveClass.status },
      });
      return;
    }

    if (liveClass.status !== "live") {
      throw badRequest("Class is not live");
    }

    const session = await LiveSession.findById(liveClass.sessionId);
    if (session) {
      session.status = "ended";
      session.endedAt = new Date();
      await session.save();
    }

    // Recordable classes move to processing only once a file is uploaded.
    // Ending early used to queue AI processing against an empty placeholder
    // and mark the recording failed before the tutor's upload finished.
    let hasUploadedFile = false;
    if (liveClass.isRecordable && liveClass.recordingId) {
      const recording = await Recording.findById(liveClass.recordingId).select(
        "fileSize storageUrl",
      );
      hasUploadedFile =
        typeof recording?.fileSize === "number" &&
        recording.fileSize > 0 &&
        Boolean(recording.storageUrl);
    }

    // Stay "ended" until upload attaches the file and queues processing.
    liveClass.status =
      liveClass.isRecordable && hasUploadedFile ? "processing" : "ended";
    await liveClass.save();

    if (liveClass.isRecordable && liveClass.recordingId && hasUploadedFile) {
      try {
        await inngest.send({
          name: "recording/process",
          data: {
            recordingId: liveClass.recordingId.toString(),
            sessionId: session?._id.toString() || "",
            classId: liveClass._id.toString(),
          },
        });
      } catch (error) {
        console.error("[endClass] Failed to queue recording process:", error);
      }
    }

    try {
      await inngest.send({
        name: "attendance/calculate",
        data: {
          sessionId: session?._id.toString() || "",
          classId: liveClass._id.toString(),
        },
      });
    } catch (error) {
      console.error("[endClass] Failed to queue attendance:", error);
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Ended class",
      details: `Ended class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.json({
      success: true,
      message: "Class ended",
      data: { status: liveClass.status },
    });
  },
);

export const joinClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    const allowed = await canAccessCategory(
      req.user!._id.toString(),
      req.user!.role,
      liveClass.category.toString(),
      req.user!.categories,
    );
    if (!allowed) {
      throw forbidden("You are not enrolled in this class's category");
    }

    if (liveClass.status !== "live") {
      throw badRequest("Class is not live");
    }

    const session = await LiveSession.findById(liveClass.sessionId);
    if (!session) throw notFound("Session not found");

    const existingParticipant = session.participants.find(
      (p) => p.userId.toString() === req.user!._id.toString(),
    );

    if (existingParticipant) {
      if (existingParticipant.leftAt) {
        existingParticipant.leftAt = undefined;
        await session.save();
      }
    } else {
      session.participants.push({
        userId: req.user!._id,
        userName: req.user!.name,
        joinedAt: new Date(),
        attendancePercentage: 0,
      });
      await session.save();
    }

    res.json({
      success: true,
      message: "Joined class",
      data: { session },
    });
  },
);

export const leaveClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    const session = await LiveSession.findById(liveClass.sessionId);
    if (!session) throw notFound("Session not found");

    const participant = session.participants.find(
      (p) => p.userId.toString() === req.user!._id.toString(),
    );

    if (participant && !participant.leftAt) {
      participant.leftAt = new Date();
      await session.save();
    }

    res.json({
      success: true,
      message: "Left class",
    });
  },
);

export const getSessionDetails = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    const allowed = await canAccessCategory(
      req.user!._id.toString(),
      req.user!.role,
      liveClass.category.toString(),
      req.user!.categories,
    );
    if (!allowed) {
      throw forbidden("You are not enrolled in this class's category");
    }

    const session = await LiveSession.findById(liveClass.sessionId)
      .populate("participants.userId", "name email avatar")
      .select("-chatMessages");

    if (!session) throw notFound("Session not found");

    res.json({
      success: true,
      data: { session },
    });
  },
);
