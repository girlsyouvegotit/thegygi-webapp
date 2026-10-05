import type { Request, Response } from "express";
import {
  enrollStudentInCategory,
  getCategoryStudents,
  dropStudentFromCategory,
  switchStudentCategory,
} from "../../services/enrollment.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Enroll student in category
 * @route POST /api/categories/:id/enroll
 */
export const enrollStudent = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const categoryId = String(req.params.id);
    const studentId = String(req.body.userId || req.user!._id.toString());

    // Check if student is enrolling themselves or admin is enrolling someone
    if (req.user!.role !== "admin" && studentId !== req.user!._id.toString()) {
      throw badRequest("Cannot enroll another user");
    }

    const enrollment = await enrollStudentInCategory(studentId, categoryId);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Enrolled in category",
      details: `Student ${studentId} enrolled in category ${categoryId}`,
      resourceType: "enrollment",
      resourceId: enrollment._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      data: { enrollment },
    });
  },
);

/**
 * Get student enrollments
 * @route GET /api/categories/:id/enrollments
 */
export const getStudentEnrollments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryId = req.params.id;
    const enrollments = await getCategoryStudents(categoryId);

    res.json({
      success: true,
      data: { enrollments },
    });
  },
);

/**
 * Drop student from category
 * @route DELETE /api/categories/:id/enroll/:studentId
 */
export const dropStudent = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: categoryId, studentId } = req.params;

    await dropStudentFromCategory(studentId, categoryId);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Dropped student from category",
      details: `Student ${studentId} dropped from category ${categoryId}`,
      resourceType: "enrollment",
      resourceId: categoryId,
    });

    res.json({
      success: true,
      message: "Student dropped from category",
    });
  },
);

/**
 * Student switches their active learning category
 * @route POST /api/enrollments/switch
 * @route POST /api/categories/:id/switch
 */
export const switchCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user!.role !== "student") {
      throw badRequest("Only students can switch learning categories");
    }

    const categoryId = String(
      req.params.id || req.body.categoryId || "",
    ).trim();
    if (!categoryId) {
      throw badRequest("categoryId is required");
    }

    const studentId = req.user!._id.toString();
    const enrollment = await switchStudentCategory(studentId, categoryId);

    await logActivity({
      userId: studentId,
      action: "Switched learning category",
      details: `Student switched active category to ${categoryId}`,
      resourceType: "enrollment",
      resourceId: enrollment._id.toString(),
    });

    res.json({
      success: true,
      message: "Learning category updated",
      data: { enrollment },
    });
  },
);
