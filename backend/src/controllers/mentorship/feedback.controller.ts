import type { Response } from "express";
import MentorFeedback from "../../models/mentor-feedback.model.js";
import MentorAssignment from "../../models/mentor-assignment.model.js";
import { createNotification } from "../../services/notification.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

const assertMentorOfMentee = async (
  mentorId: string,
  menteeId: string,
): Promise<void> => {
  const assignment = await MentorAssignment.findOne({
    mentor: mentorId,
    mentees: menteeId,
    isActive: true,
  });
  if (!assignment) throw forbidden("Not assigned to this mentee");
};

/**
 * Create feedback
 * @route POST /api/mentorship/feedback
 */
export const createFeedback = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      menteeId,
      categoryId,
      projectTitle,
      technicalSkills,
      uiUx,
      problemSolving,
      communication,
      overall,
      feedback,
      recommendations,
    } = req.body;

    if (req.user!.role !== "admin") {
      await assertMentorOfMentee(req.user!._id.toString(), menteeId);
    }

    const mentorFeedback = await MentorFeedback.create({
      mentor: req.user!._id,
      mentee: menteeId,
      category: categoryId,
      projectTitle,
      technicalSkills,
      uiUx,
      problemSolving,
      communication,
      overall,
      feedback,
      recommendations: recommendations || [],
    });

    await createNotification({
      user: menteeId,
      type: "mentor_feedback",
      title: "New Feedback Received",
      message: `Your mentor provided feedback on "${projectTitle}"`,
      link: `/mentorship`,
      metadata: { feedbackId: mentorFeedback._id },
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Provided mentor feedback",
      details: `Provided feedback on: ${projectTitle}`,
      resourceType: "mentor-feedback",
      resourceId: mentorFeedback._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Feedback provided",
      data: { feedback: mentorFeedback },
    });
  },
);

/**
 * Get all feedback created by the current mentor
 * @route GET /api/mentorship/feedback
 */
export const getAllMyFeedback = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const feedback = await MentorFeedback.find({ mentor: req.user!._id })
      .populate("mentee", "name email avatar")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { feedback } });
  },
);

/**
 * Get feedback for a specific mentee
 * @route GET /api/mentorship/feedback/mentee/:menteeId
 */
export const getFeedback = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { menteeId } = req.params;
    const isSelf = menteeId === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";

    const filter: Record<string, unknown> = { mentee: menteeId };
    if (req.user!.role === "mentor") filter.mentor = req.user!._id;
    if (!isSelf && !isAdmin && req.user!.role !== "mentor") {
      throw forbidden("Not authorized to view this feedback");
    }

    const feedback = await MentorFeedback.find(filter)
      .populate("mentor", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { feedback } });
  },
);

/**
 * Update feedback
 * @route PUT /api/mentorship/feedback/:id
 */
export const updateFeedback = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const feedback = await MentorFeedback.findById(req.params.id);
    if (!feedback) throw notFound("Feedback not found");

    if (
      req.user!.role !== "admin" &&
      feedback.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this feedback");
    }

    const updated = await MentorFeedback.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      message: "Feedback updated",
      data: { feedback: updated },
    });
  },
);

/**
 * Delete feedback
 * @route DELETE /api/mentorship/feedback/:id
 */
export const deleteFeedback = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const feedback = await MentorFeedback.findById(req.params.id);
    if (!feedback) throw notFound("Feedback not found");

    if (
      req.user!.role !== "admin" &&
      feedback.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this feedback");
    }

    await MentorFeedback.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted mentor feedback",
      resourceType: "mentor-feedback",
      resourceId: req.params.id,
    });

    res.json({ success: true, message: "Feedback deleted" });
  },
);
