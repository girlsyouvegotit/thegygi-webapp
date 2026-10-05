import type { Request, Response } from "express";
import {
  addTutorToCategory,
  addMentorToCategory,
  removeTutorFromCategory,
  removeMentorFromCategory,
} from "../../services/category.service.js";
import { createMentorAssignment } from "../../services/mentor-assignment.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  notFound,
} from "../../middleware/error.middleware.js";

/**
 * Assign tutor to category
 * @route POST /api/categories/:id/assign-tutor
 */
export const assignTutor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { tutorId } = req.body;
    const categoryId = req.params.id;

    const category = await addTutorToCategory(categoryId, tutorId);

    if (!category) {
      throw notFound("Category not found");
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Assigned tutor to category",
      details: `Tutor ${tutorId} assigned to category ${categoryId}`,
      resourceType: "category",
      resourceId: categoryId,
      metadata: { tutorId },
    });

    res.json({
      success: true,
      message: "Tutor assigned successfully",
      data: { category },
    });
  },
);

/**
 * Assign mentor to category
 * @route POST /api/categories/:id/assign-mentor
 */
export const assignMentor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId, maxMentees } = req.body;
    const categoryId = req.params.id;

    const category = await addMentorToCategory(categoryId, mentorId);

    if (!category) {
      throw notFound("Category not found");
    }

    // Create mentor assignment
    await createMentorAssignment(mentorId, categoryId, maxMentees || 10);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Assigned mentor to category",
      details: `Mentor ${mentorId} assigned to category ${categoryId}`,
      resourceType: "category",
      resourceId: categoryId,
      metadata: { mentorId, maxMentees },
    });

    res.json({
      success: true,
      message: "Mentor assigned successfully",
      data: { category },
    });
  },
);

/**
 * Remove tutor from category
 * @route DELETE /api/categories/:id/remove-tutor/:tutorId
 */
export const removeTutor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: categoryId, tutorId } = req.params;

    const category = await removeTutorFromCategory(categoryId, tutorId);

    if (!category) {
      throw notFound("Category not found");
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Removed tutor from category",
      details: `Tutor ${tutorId} removed from category ${categoryId}`,
      resourceType: "category",
      resourceId: categoryId,
      metadata: { tutorId },
    });

    res.json({
      success: true,
      message: "Tutor removed successfully",
    });
  },
);

/**
 * Remove mentor from category
 * @route DELETE /api/categories/:id/remove-mentor/:mentorId
 */
export const removeMentor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: categoryId, mentorId } = req.params;

    const category = await removeMentorFromCategory(categoryId, mentorId);

    if (!category) {
      throw notFound("Category not found");
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Removed mentor from category",
      details: `Mentor ${mentorId} removed from category ${categoryId}`,
      resourceType: "category",
      resourceId: categoryId,
      metadata: { mentorId },
    });

    res.json({
      success: true,
      message: "Mentor removed successfully",
    });
  },
);
