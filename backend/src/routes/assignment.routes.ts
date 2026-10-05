import express from "express";
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCategory,
} from "../controllers/assessments/assignment.controller.js";
import {
  submitAssignment,
  getMySubmission,
  getAssignmentSubmissions,
} from "../controllers/assessments/submission.controller.js";
import {
  gradeSubmission,
  getGradingDetails,
} from "../controllers/assessments/grading.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  tutorOrAdmin,
  anyAuthenticated,
  studentOnly,
  adminOnly,
} from "../middleware/role.middleware.js";
import {
  requireCategoryEnrollment,
  requireTutorAssignment,
} from "../middleware/category.middleware.js";
import { validateBody, validateParams } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const createAssignmentSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  dueDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Due date must be in the future",
  }),
  maxScore: z.number().min(1).max(1000),
  submissionTypes: z.array(z.enum(["file", "text", "github_url"])).min(1),
});

const updateAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  dueDate: z.string().optional(),
  maxScore: z.number().min(1).max(1000).optional(),
  submissionTypes: z.array(z.enum(["file", "text", "github_url"])).optional(),
  isActive: z.boolean().optional(),
});

const countWords = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const submitAssignmentSchema = z
  .object({
    submissionType: z.enum(["file", "text", "github_url"]),
    content: z.string().max(40000).optional().default(""),
    attachments: z.array(z.string().url()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.submissionType === "text") {
      const words = countWords(data.content || "");
      if (words < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Write your answer before submitting",
          path: ["content"],
        });
      } else if (words > 3000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Text submissions cannot exceed 3,000 words",
          path: ["content"],
        });
      }
      return;
    }

    if (data.submissionType === "github_url") {
      const url = (data.content || "").trim();
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a link",
          path: ["content"],
        });
      } else if (!/^https?:\/\/.+/i.test(url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid URL starting with http:// or https://",
          path: ["content"],
        });
      }
      return;
    }

    if (data.submissionType === "file") {
      if (!data.attachments || data.attachments.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Upload at least one file",
          path: ["attachments"],
        });
      }
    }
  });

const gradeSchema = z.object({
  score: z.number().min(0, "Score cannot be negative"),
  feedback: z.string().max(5000).optional(),
});

const assignmentIdSchema = z.object({
  id: z.string().min(1, "Assignment ID is required"),
});

const submissionIdSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
});

// All routes require authentication
router.use(protect);

// Student routes (must be before bare "/:id" where needed)

// Tutor/Admin routes
router.post(
  "/",
  tutorOrAdmin,
  validateBody(createAssignmentSchema),
  requireTutorAssignment,
  createAssignment,
);

// General routes
router.get("/", anyAuthenticated, getAllAssignments);
router.get("/category/:categoryId", anyAuthenticated, getAssignmentsByCategory);

// Parameterized routes
router.get(
  "/:id",
  anyAuthenticated,
  validateParams(assignmentIdSchema),
  getAssignmentById,
);

router.put(
  "/:id",
  tutorOrAdmin,
  validateParams(assignmentIdSchema),
  validateBody(updateAssignmentSchema),
  updateAssignment,
);

router.delete(
  "/:id",
  tutorOrAdmin,
  validateParams(assignmentIdSchema),
  deleteAssignment,
);

// Submission routes
router.get(
  "/:id/my-submission",
  studentOnly,
  validateParams(assignmentIdSchema),
  getMySubmission,
);

router.post(
  "/:id/submit",
  studentOnly,
  validateParams(assignmentIdSchema),
  validateBody(submitAssignmentSchema),
  submitAssignment,
);

router.get(
  "/:id/submissions",
  tutorOrAdmin,
  validateParams(assignmentIdSchema),
  getAssignmentSubmissions,
);

// Grading routes
router.post(
  "/submissions/:submissionId/grade",
  tutorOrAdmin,
  validateParams(submissionIdSchema),
  validateBody(gradeSchema),
  gradeSubmission,
);

router.get(
  "/submissions/:submissionId",
  tutorOrAdmin,
  validateParams(submissionIdSchema),
  getGradingDetails,
);

export default router;
