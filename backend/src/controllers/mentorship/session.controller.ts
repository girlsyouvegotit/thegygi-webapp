import type { Response } from "express";
import MentorshipSession from "../../models/mentorship-session.model.js";
import { createNotification } from "../../services/notification.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

export const createSession = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      menteeId,
      categoryId,
      topic,
      description,
      scheduledDate,
      duration,
      type,
    } = req.body;

    const scheduled = new Date(scheduledDate);

    const session = await MentorshipSession.create({
      mentor: req.user!._id,
      mentee: menteeId,
      category: categoryId,
      topic,
      description,
      scheduledDate: scheduled,
      duration,
      type: type || "one_on_one",
    });

    await createNotification({
      user: menteeId,
      type: "session_scheduled",
      title: "Mentorship Session Scheduled",
      message: `A mentorship session "${topic}" has been scheduled for ${scheduled.toLocaleString()}`,
      link: `/mentorship/sessions/${session._id}`,
      metadata: { sessionId: session._id },
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Scheduled mentorship session",
      details: `Scheduled session: ${topic}`,
      resourceType: "mentorship-session",
      resourceId: session._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Session scheduled",
      data: { session },
    });
  },
);

export const getSession = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const session = await MentorshipSession.findById(req.params.id)
      .populate("mentor", "name email avatar")
      .populate("mentee", "name email avatar")
      .populate("category", "name slug");

    if (!session) throw notFound("Session not found");

    const uid = req.user!._id.toString();
    const isMentor = (session.mentor as any)._id.toString() === uid;
    const isMentee = (session.mentee as any)._id.toString() === uid;
    const isAdmin = req.user!.role === "admin";

    if (!isMentor && !isMentee && !isAdmin) {
      throw forbidden("Not authorized to view this session");
    }

    res.json({ success: true, data: { session } });
  },
);

export const getMySessions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    let query: Record<string, unknown> = {};
    if (req.user!.role === "mentor") query = { mentor: req.user!._id };
    else if (req.user!.role === "student") query = { mentee: req.user!._id };

    const sessions = await MentorshipSession.find(query)
      .populate("mentor", "name email avatar")
      .populate("mentee", "name email avatar")
      .populate("category", "name slug")
      .sort({ scheduledDate: -1 });

    res.json({ success: true, data: { sessions } });
  },
);

export const updateSession = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) throw notFound("Session not found");

    if (
      req.user!.role !== "admin" &&
      session.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this session");
    }

    const updated = await MentorshipSession.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      message: "Session updated",
      data: { session: updated },
    });
  },
);

export const cancelSession = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) throw notFound("Session not found");

    if (
      req.user!.role !== "admin" &&
      session.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to cancel this session");
    }

    session.status = "cancelled";
    await session.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Cancelled mentorship session",
      details: `Cancelled session: ${session.topic}`,
      resourceType: "mentorship-session",
      resourceId: session._id.toString(),
    });

    res.json({ success: true, message: "Session cancelled" });
  },
);

export const completeSession = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) throw notFound("Session not found");

    if (
      req.user!.role !== "admin" &&
      session.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to complete this session");
    }

    session.status = "completed";
    if (req.body.notes) session.notes = req.body.notes;
    await session.save();

    await createNotification({
      user: session.mentee.toString(),
      type: "session_reminder",
      title: "Session Completed",
      message: `Your mentorship session "${session.topic}" has been completed`,
      link: `/mentorship`,
      metadata: { sessionId: session._id },
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Completed mentorship session",
      details: `Completed session: ${session.topic}`,
      resourceType: "mentorship-session",
      resourceId: session._id.toString(),
    });

    res.json({ success: true, message: "Session completed" });
  },
);
