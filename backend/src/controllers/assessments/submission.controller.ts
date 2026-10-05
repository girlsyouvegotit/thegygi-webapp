import type { Request, Response } from "express";
import Assignment from "../../models/assignment.model.js";
import AssignmentSubmission from "../../models/assignment-submission.model.js";
import { logActivity } from "../../services/activity.service.js";
import { recomputeAndPersistProgress } from "../../services/progress.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Submit assignment
 * @route POST /api/assignments/:id/submit
 */
export const submitAssignment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = req.params.id;
    const { submissionType, content, attachments } = req.body;
    const studentId = req.user!._id.toString();

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      throw notFound("Assignment not found");
    }

    // Check if past due date
    if (new Date() > assignment.dueDate) {
      throw badRequest("Assignment is past due date");
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (existingSubmission) {
      throw badRequest("Assignment already submitted");
    }

    if (
      !assignment.submissionTypes.includes(submissionType)
    ) {
      throw badRequest("This submission type is not allowed for this assignment");
    }

    if (submissionType === "text") {
      const words = String(content || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (words < 1) throw badRequest("Write your answer before submitting");
      if (words > 3000) {
        throw badRequest("Text submissions cannot exceed 3,000 words");
      }
    }

    if (submissionType === "github_url") {
      const url = String(content || "").trim();
      if (!/^https?:\/\/.+/i.test(url)) {
        throw badRequest("Enter a valid link starting with http:// or https://");
      }
    }

    if (submissionType === "file") {
      if (!attachments || !Array.isArray(attachments) || attachments.length < 1) {
        throw badRequest("Upload at least one file");
      }
    }

    const submission = await AssignmentSubmission.create({
      assignment: assignmentId,
      student: studentId,
      submissionType,
      content:
        submissionType === "file"
          ? String(content || "").trim() || "File submission"
          : String(content || "").trim(),
      attachments: attachments || [],
    });

    await logActivity({
      userId: studentId,
      action: "Submitted assignment",
      details: `Submitted assignment: ${assignment.title}`,
      resourceType: "assignment",
      resourceId: assignmentId,
    });

    try {
      await recomputeAndPersistProgress(
        studentId,
        assignment.category.toString(),
      );
    } catch (err) {
      console.error(
        "Progress recompute after assignment failed:",
        err instanceof Error ? err.message : err,
      );
    }

    res.status(201).json({
      success: true,
      message: "Assignment submitted",
      data: { submission },
    });
  },
);

/**
 * Get my submission for an assignment
 * @route GET /api/assignments/:id/my-submission
 */
export const getMySubmission = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = req.params.id;
    const studentId = req.user!._id.toString();

    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    if (!submission) {
      throw notFound("No submission found");
    }

    res.json({
      success: true,
      data: { submission },
    });
  },
);

/**
 * Get all submissions for an assignment (tutor/admin)
 * @route GET /api/assignments/:id/submissions
 */
export const getAssignmentSubmissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const assignmentId = req.params.id;

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    })
      .populate("student", "name email avatar")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: { submissions },
    });
  },
);
