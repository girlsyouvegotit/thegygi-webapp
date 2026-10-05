import type { Response } from "express";
import MentorshipGoal from "../../models/mentorship-goal.model.js";
import MentorAssignment from "../../models/mentor-assignment.model.js";
import { createNotification } from "../../services/notification.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Create mentorship goal
 * @route POST /api/mentorship/goals
 */
export const createGoal = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { menteeId, categoryId, title, description, targetDate, milestones } =
      req.body;

    const goal = await MentorshipGoal.create({
      mentor: req.user!._id,
      mentee: menteeId,
      category: categoryId,
      title,
      description,
      targetDate,
      milestones: milestones || [],
    });

    await createNotification({
      user: menteeId,
      type: "goal_updated",
      title: "New Goal Created",
      message: `Your mentor created a new goal: "${title}"`,
      link: `/mentorship`,
      metadata: { goalId: goal._id },
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created mentorship goal",
      details: `Created goal: ${title}`,
      resourceType: "mentorship-goal",
      resourceId: goal._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Goal created",
      data: { goal },
    });
  },
);

/**
 * Get all goals created by the current mentor
 * @route GET /api/mentorship/goals
 */
export const getAllMyGoals = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const goals = await MentorshipGoal.find({ mentor: req.user!._id })
      .populate("mentee", "name email avatar")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { goals } });
  },
);

/**
 * Get goals for a specific mentee
 * @route GET /api/mentorship/goals/mentee/:menteeId
 */
export const getGoals = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { menteeId } = req.params;
    const isSelf = menteeId === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";
    const isMentor = req.user!.role === "mentor";

    if (!isSelf && !isAdmin && !isMentor) {
      throw forbidden("Not authorized to view these goals");
    }

    if (isMentor && !isAdmin && !isSelf) {
      const assigned = await MentorAssignment.findOne({
        mentor: req.user!._id,
        mentees: menteeId,
        isActive: true,
      });
      if (!assigned) throw forbidden("Not assigned to this mentee");
    }

    const goals = await MentorshipGoal.find({ mentee: menteeId })
      .populate("mentor", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { goals } });
  },
);

/**
 * Update goal
 * @route PUT /api/mentorship/goals/:id
 */
export const updateGoal = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const goal = await MentorshipGoal.findById(req.params.id);
    if (!goal) throw notFound("Goal not found");

    if (
      req.user!.role !== "admin" &&
      goal.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this goal");
    }

    const updated = await MentorshipGoal.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      message: "Goal updated",
      data: { goal: updated },
    });
  },
);

/**
 * Delete goal
 * @route DELETE /api/mentorship/goals/:id
 */
export const deleteGoal = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const goal = await MentorshipGoal.findById(req.params.id);
    if (!goal) throw notFound("Goal not found");

    if (
      req.user!.role !== "admin" &&
      goal.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this goal");
    }

    await MentorshipGoal.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted mentorship goal",
      details: `Deleted goal: ${goal.title}`,
      resourceType: "mentorship-goal",
      resourceId: req.params.id,
    });

    res.json({ success: true, message: "Goal deleted" });
  },
);

/**
 * Add milestone to goal
 * @route POST /api/mentorship/goals/:id/milestones
 */
export const addMilestone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const goal = await MentorshipGoal.findById(req.params.id);
    if (!goal) throw notFound("Goal not found");

    if (
      req.user!.role !== "admin" &&
      goal.mentor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this goal");
    }

    goal.milestones.push({
      title: req.body.title,
      completed: false,
    } as any);
    await goal.save();

    res.json({ success: true, message: "Milestone added", data: { goal } });
  },
);

/**
 * Update milestone
 * @route PUT /api/mentorship/milestones/:id
 */
export const updateMilestone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { completed } = req.body;
    const milestoneId = req.params.id;

    const goal = await MentorshipGoal.findOne({
      "milestones._id": milestoneId,
    });
    if (!goal) throw notFound("Milestone not found");

    if (
      req.user!.role !== "admin" &&
      goal.mentor.toString() !== req.user!._id.toString() &&
      goal.mentee.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this milestone");
    }

    const milestone = goal.milestones.find(
      (m) => m._id.toString() === milestoneId,
    );
    if (milestone) {
      milestone.completed = completed;
      milestone.completedAt = completed ? new Date() : undefined;
      if (goal.milestones.every((m) => m.completed)) {
        goal.status = "completed";
      }
      await goal.save();
    }

    res.json({ success: true, message: "Milestone updated", data: { goal } });
  },
);
