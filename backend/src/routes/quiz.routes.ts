import express from "express";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getQuizzesByCategory,
  launchLiveQuiz,
} from "../controllers/assessments/quiz.controller.js";
import {
  submitQuiz,
  getQuizResult,
  getQuizResults,
  getStudentQuizResults,
} from "../controllers/assessments/quiz-submission.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  tutorOrAdmin,
  anyAuthenticated,
  studentOnly,
} from "../middleware/role.middleware.js";
import { requireTutorAssignment } from "../middleware/category.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

const correctAnswerSchema = z.union([z.string().min(1), z.array(z.string())]);

const dateInput = z
  .union([z.string().min(1), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");

const createQuizSchema = z
  .object({
    categoryId: z.string().min(1),
    title: z.string().min(3),
    description: z.string().optional(),
    questions: z
      .array(
        z.object({
          type: z.enum([
            "MCQ",
            "multiple_select",
            "true_false",
            "short_answer",
            "fill_blank",
          ]),
          questionText: z.string().min(1),
          options: z.array(z.string()).optional(),
          correctAnswer: correctAnswerSchema,
          points: z.coerce.number().min(1).max(100),
          explanation: z.string().optional(),
        }),
      )
      .min(1),
    duration: z.coerce.number().min(1).max(300),
    passingScore: z.coerce.number().min(0).max(100),
    attempts: z.coerce.number().min(1).max(100),
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    isLiveQuiz: z.boolean().optional(),
    randomization: z.boolean().optional(),
    showAnswers: z.boolean().optional(),
  })
  .transform((data) => {
    const startDate = data.startDate ?? new Date();
    // Availability window matches quiz duration (minutes), not a long calendar span.
    const endDate =
      data.endDate ??
      new Date(startDate.getTime() + data.duration * 60 * 1000);
    return { ...data, startDate, endDate };
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
    }),
  ),
});

const launchSchema = z.object({ sessionId: z.string().min(1) });

router.use(protect);

router.post(
  "/",
  tutorOrAdmin,
  validateBody(createQuizSchema),
  requireTutorAssignment,
  createQuiz,
);
router.put("/:id", tutorOrAdmin, updateQuiz);
router.delete("/:id", tutorOrAdmin, deleteQuiz);

router.get("/", anyAuthenticated, getAllQuizzes);
router.get("/category/:categoryId", anyAuthenticated, getQuizzesByCategory);
router.get("/:id", anyAuthenticated, getQuizById);

router.post(
  "/:id/launch",
  tutorOrAdmin,
  validateBody(launchSchema),
  launchLiveQuiz,
);

router.post(
  "/:id/submit",
  studentOnly,
  validateBody(submitQuizSchema),
  submitQuiz,
);
router.get("/:id/result", studentOnly, getQuizResult);
router.get("/:id/results", tutorOrAdmin, getQuizResults);
router.get("/student/:studentId/results", tutorOrAdmin, getStudentQuizResults);

export default router;
