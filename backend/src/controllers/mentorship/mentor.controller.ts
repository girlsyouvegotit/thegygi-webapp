import type { Response } from "express";
import MentorAssignment from "../../models/mentor-assignment.model.js";
import {
  createMentorAssignment,
  getMentorAssignments,
  getStudentMentor,
  deactivateMentorAssignment,
  updateMaxMentees,
  manuallyAssignMentor,
  removeMenteeFromMentor,
  getCategoryMentorshipOptions,
} from "../../services/mentor-assignment.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Get my mentor (student)
 * @route GET /api/mentorship/my-mentor
 */
export const getMyMentor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const categoryId = req.query.categoryId as string;

    if (
      !categoryId &&
      req.user!.categories &&
      req.user!.categories.length > 0
    ) {
      // Use first category if not specified
      const mentor = await getStudentMentor(
        req.user!._id.toString(),
        req.user!.categories[0].toString(),
      );
      res.json({
        success: true,
        data: { mentor: mentor?.mentor || null },
      });
      return;
    }

    const mentor = await getStudentMentor(req.user!._id.toString(), categoryId);
    res.json({
      success: true,
      data: { mentor: mentor?.mentor || null },
    });
  },
);

/**
 * Get my mentees (mentor)
 * @route GET /api/mentorship/my-mentees
 */
export const getMyMentees = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignments = await getMentorAssignments(req.user!._id.toString());

    res.json({
      success: true,
      data: { assignments },
    });
  },
);

/**
 * Get all mentor assignments (admin)
 * @route GET /api/mentorship/assignments
 */
export const getAllAssignments = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignments = await MentorAssignment.find({ isActive: true })
      .populate("mentor", "name email avatar")
      .populate("category", "name slug")
      .populate("mentees", "name email avatar");

    res.json({
      success: true,
      data: { assignments },
    });
  },
);

/**
 * Create mentor assignment (admin)
 * @route POST /api/mentorship/assignments
 */
export const createAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId, categoryId, maxMentees } = req.body;

    const assignment = await createMentorAssignment(
      mentorId,
      categoryId,
      maxMentees || 10,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created mentor assignment",
      details: `Assigned mentor ${mentorId} to category ${categoryId}`,
      resourceType: "mentor-assignment",
      resourceId: assignment._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Mentor assignment created",
      data: { assignment },
    });
  },
);

/**
 * Update mentor assignment (admin)
 * @route PUT /api/mentorship/assignments/:id
 */
export const updateAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { maxMentees, isActive } = req.body;

    if (maxMentees) {
      const assignment = await updateMaxMentees(req.params.id, maxMentees);
      res.json({
        success: true,
        message: "Assignment updated",
        data: { assignment },
      });
      return;
    }

    if (isActive === false) {
      await deactivateMentorAssignment(req.params.id);
      res.json({
        success: true,
        message: "Assignment deactivated",
      });
      return;
    }

    throw badRequest("Nothing to update");
  },
);

/**
 * Delete mentor assignment (admin)
 * @route DELETE /api/mentorship/assignments/:id
 */
export const deleteAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await deactivateMentorAssignment(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted mentor assignment",
      details: `Deleted mentor assignment ID: ${req.params.id}`,
      resourceType: "mentor-assignment",
      resourceId: req.params.id,
    });

    res.json({
      success: true,
      message: "Mentor assignment deleted",
    });
  },
);

/**
 * Category mentors + students for admin pickers
 * @route GET /api/mentorship/assignments/options?categoryId=
 */
export const getAssignmentOptions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const categoryId =
      typeof req.query.categoryId === "string" ? req.query.categoryId : "";
    if (!categoryId) throw badRequest("categoryId is required");

    const options = await getCategoryMentorshipOptions(categoryId);
    res.json({
      success: true,
      data: options,
    });
  },
);

/**
 * Assign a student to a mentor within a category (admin)
 * @route POST /api/mentorship/assignments/assign-mentee
 */
export const assignMenteeToMentor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId, studentId, categoryId } = req.body as {
      mentorId?: string;
      studentId?: string;
      categoryId?: string;
    };

    if (!mentorId || !studentId || !categoryId) {
      throw badRequest("mentorId, studentId, and categoryId are required");
    }

    const assignment = await manuallyAssignMentor(
      mentorId,
      studentId,
      categoryId,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Assigned mentee to mentor",
      details: `Student ${studentId} → mentor ${mentorId} in category ${categoryId}`,
      resourceType: "mentor-assignment",
      resourceId: assignment._id.toString(),
    });

    res.json({
      success: true,
      message: "Student assigned to mentor",
      data: { assignment },
    });
  },
);

/**
 * Remove a student from a mentor within a category (admin)
 * @route DELETE /api/mentorship/assignments/mentee
 */
export const unassignMenteeFromMentor = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { mentorId, studentId, categoryId } = req.body as {
      mentorId?: string;
      studentId?: string;
      categoryId?: string;
    };

    if (!mentorId || !studentId || !categoryId) {
      throw badRequest("mentorId, studentId, and categoryId are required");
    }

    await removeMenteeFromMentor(mentorId, studentId, categoryId);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Removed mentee from mentor",
      details: `Student ${studentId} removed from mentor ${mentorId} in category ${categoryId}`,
      resourceType: "mentor-assignment",
      resourceId: mentorId,
    });

    res.json({
      success: true,
      message: "Student removed from mentor",
    });
  },
);
