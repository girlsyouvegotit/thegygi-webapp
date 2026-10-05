import type { Request, Response } from "express";
import AssignmentSubmission from "../../models/assignment-submission.model.js";
import Assignment from "../../models/assignment.model.js";
import { logActivity } from "../../services/activity.service.js";
import { createNotification } from "../../services/notification.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

const getParamString = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : param || "";
};

export const gradeSubmission = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const submissionId = getParamString(req.params.submissionId);
    const { score, feedback } = req.body;

    // Find submission without populate first
    const submission = await AssignmentSubmission.findById(submissionId);

    if (!submission) {
      throw notFound("Submission not found");
    }

    // Find assignment separately (cleaner approach)
    const assignment = await Assignment.findById(submission.assignment);

    if (!assignment) {
      throw notFound("Assignment not found");
    }

    // Check authorization
    if (
      req.user!.role !== "admin" &&
      assignment.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to grade this submission");
    }

    // Validate score
    if (score > assignment.maxScore) {
      throw forbidden(
        `Score cannot exceed maximum score of ${assignment.maxScore}`,
      );
    }

    // Update submission
    submission.score = score;
    submission.feedback = feedback || "";
    submission.status = "graded";
    submission.gradedBy = req.user!._id;
    submission.gradedAt = new Date();
    await submission.save();

    // Notify student
    await createNotification({
      user: submission.student.toString(),
      type: "assignment_graded",
      title: "Assignment Graded",
      message: `Your submission has been graded. Score: ${score}/${assignment.maxScore}`,
      link: `/assignments`,
      metadata: { submissionId, score },
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Graded assignment submission",
      details: `Graded submission ID: ${submissionId}`,
      resourceType: "submission",
      resourceId: submissionId,
      metadata: { score, feedback },
    });

    // Return populated submission
    const populatedSubmission = await AssignmentSubmission.findById(
      submissionId,
    )
      .populate("student", "name email avatar")
      .populate("assignment", "title maxScore dueDate")
      .populate("gradedBy", "name email");

    res.json({
      success: true,
      message: "Submission graded",
      data: { submission: populatedSubmission },
    });
  },
);

export const getGradingDetails = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const submissionId = getParamString(req.params.submissionId);

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate("student", "name email avatar")
      .populate("assignment", "title maxScore dueDate")
      .populate("gradedBy", "name email");

    if (!submission) {
      throw notFound("Submission not found");
    }

    res.json({
      success: true,
      data: { submission },
    });
  },
);
