import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category/category.controller.js";
import {
  enrollStudent,
  getStudentEnrollments,
  dropStudent,
} from "../controllers/category/enrollment.controller.js";
import {
  assignTutor,
  assignMentor,
  removeTutor,
  removeMentor,
} from "../controllers/category/assignment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  adminOnly,
  tutorOrAdmin,
  anyAuthenticated,
} from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const completionRulesSchema = z
  .object({
    attendanceWeight: z.number().min(0).max(100).optional(),
    quizWeight: z.number().min(0).max(100).optional(),
    assignmentWeight: z.number().min(0).max(100).optional(),
    passThreshold: z.number().min(1).max(100).optional(),
  })
  .optional();

const createCategorySchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    icon: z.string().optional(),
    bannerImage: z.string().optional(),
    durationWeeks: z.number().min(1).max(104).nullable().optional(),
    certificateEnabled: z.boolean().optional(),
    certificateTitle: z.string().max(200).nullable().optional(),
    completionRules: completionRulesSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.certificateEnabled !== false &&
      (!data.certificateTitle || !data.certificateTitle.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Certificate title is required when certificates are enabled",
        path: ["certificateTitle"],
      });
    }
  });

const updateCategorySchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    icon: z.string().optional(),
    bannerImage: z.string().optional(),
    isActive: z.boolean().optional(),
    durationWeeks: z.number().min(1).max(104).nullable().optional(),
    certificateEnabled: z.boolean().optional(),
    certificateTitle: z.string().max(200).nullable().optional(),
    completionRules: completionRulesSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.certificateEnabled === true &&
      data.certificateTitle !== undefined &&
      (!data.certificateTitle || !String(data.certificateTitle).trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Certificate title is required when certificates are enabled",
        path: ["certificateTitle"],
      });
    }
  });

const enrollSchema = z.object({
  userId: z.string().optional(),
});

const assignTutorSchema = z.object({
  tutorId: z.string().min(1, "Tutor ID is required"),
});

const assignMentorSchema = z.object({
  mentorId: z.string().min(1, "Mentor ID is required"),
  maxMentees: z.number().min(1).max(50).optional(),
});

// Public routes (list active categories)
router.get("/", getAllCategories);

// Protected routes
router.get("/:id", protect, getCategoryById);

// Admin routes
router.post(
  "/",
  protect,
  adminOnly,
  validateBody(createCategorySchema),
  createCategory,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  validateBody(updateCategorySchema),
  updateCategory,
);
router.delete("/:id", protect, adminOnly, deleteCategory);

// Tutor/Mentor assignment (admin only)
router.post(
  "/:id/assign-tutor",
  protect,
  adminOnly,
  validateBody(assignTutorSchema),
  assignTutor,
);
router.post(
  "/:id/assign-mentor",
  protect,
  adminOnly,
  validateBody(assignMentorSchema),
  assignMentor,
);
router.delete("/:id/remove-tutor/:tutorId", protect, adminOnly, removeTutor);
router.delete("/:id/remove-mentor/:mentorId", protect, adminOnly, removeMentor);

// Enrollment (student self-enroll or admin)
router.post("/:id/enroll", protect, validateBody(enrollSchema), enrollStudent);
router.get("/:id/enrollments", protect, tutorOrAdmin, getStudentEnrollments);
router.delete("/:id/enroll/:studentId", protect, adminOnly, dropStudent);

export default router;
