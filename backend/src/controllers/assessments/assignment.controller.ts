import type { Request, Response } from "express";
import Assignment from "../../models/assignment.model.js";
import Category from "../../models/category.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

// Helper to normalize param to string
const getParamString = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : param || "";
};

async function assertTutorAssignedToCategory(
  categoryId: string,
  user: NonNullable<AuthRequest["user"]>,
): Promise<boolean> {
  const category = await Category.findById(categoryId).select("tutors");
  if (!category) return false;

  const onCategory = category.tutors.some(
    (t) => t.toString() === user._id.toString(),
  );
  const onUser = (user.categories || []).some(
    (c) => c.toString() === categoryId,
  );
  return onCategory || onUser;
}

export const createAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      categoryId,
      title,
      description,
      dueDate,
      maxScore,
      submissionTypes,
    } = req.body;

    // Tutors: assignment already enforced by requireTutorAssignment middleware.
    // Double-check here so direct controller use stays safe.
    if (req.user!.role === "tutor") {
      const allowed = await assertTutorAssignedToCategory(
        String(categoryId),
        req.user!,
      );
      if (!allowed) {
        throw forbidden(
          "You can only create assignments for your assigned categories",
        );
      }
    }

    const assignment = await Assignment.create({
      category: categoryId,
      tutor: req.user!._id,
      title,
      description,
      dueDate,
      maxScore,
      submissionTypes,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created assignment",
      details: `Created assignment: ${title}`,
      resourceType: "assignment",
      resourceId: assignment._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Assignment created",
      data: { assignment },
    });
  },
);

export const getAllAssignments = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    let query: any = {};

    if (req.user!.role === "student") {
      query = { category: { $in: req.user!.categories }, isActive: true };
    } else if (req.user!.role === "tutor") {
      query = { tutor: req.user!._id };
    }

    const assignments = await Assignment.find(query)
      .populate("category", "name slug")
      .populate("tutor", "name email")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: { assignments },
    });
  },
);

export const getAssignmentsByCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const categoryId = getParamString(req.params.categoryId);

    const assignments = await Assignment.find({
      category: categoryId,
      isActive: true,
    })
      .populate("tutor", "name email")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: { assignments },
    });
  },
);

export const getAssignmentById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = getParamString(req.params.id);

    const assignment = await Assignment.findById(assignmentId)
      .populate("category", "name slug")
      .populate("tutor", "name email");

    if (!assignment) {
      throw notFound("Assignment not found");
    }

    res.json({
      success: true,
      data: { assignment },
    });
  },
);

export const updateAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = getParamString(req.params.id);

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      throw notFound("Assignment not found");
    }

    if (
      req.user!.role !== "admin" &&
      assignment.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this assignment");
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { ...req.body },
      { new: true, runValidators: true },
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated assignment",
      details: `Updated assignment: ${updatedAssignment?.title}`,
      resourceType: "assignment",
      resourceId: assignmentId,
    });

    res.json({
      success: true,
      message: "Assignment updated",
      data: { assignment: updatedAssignment },
    });
  },
);

export const deleteAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = getParamString(req.params.id);

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      throw notFound("Assignment not found");
    }

    if (
      req.user!.role !== "admin" &&
      assignment.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this assignment");
    }

    await Assignment.findByIdAndDelete(assignmentId);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted assignment",
      details: `Deleted assignment: ${assignment.title}`,
      resourceType: "assignment",
      resourceId: assignmentId,
    });

    res.json({
      success: true,
      message: "Assignment deleted",
    });
  },
);
