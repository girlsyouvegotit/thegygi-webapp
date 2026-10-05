import type { Request, Response } from "express";
import Quiz from "../../models/quiz.model.js";
import QuizSubmission from "../../models/quiz-submission.model.js";
import { logActivity } from "../../services/activity.service.js";
import { recomputeAndPersistProgress } from "../../services/progress.service.js";
import { inngest } from "../../inngest/client.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  badRequest,
} from "../../middleware/error.middleware.js";

/**
 * Submit quiz
 * @route POST /api/quizzes/:id/submit
 */
export const submitQuiz = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = req.params.id;
    const { answers } = req.body;
    const studentId = req.user!._id.toString();

    const quiz = await Quiz.findById(quizId).select("+questions.correctAnswer");

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      throw badRequest("Quiz is not active");
    }

    // Check attempt count — students cannot exceed assigned attempts
    const existingAttempts = await QuizSubmission.countDocuments({
      quiz: quizId,
      student: studentId,
    });

    if (existingAttempts >= quiz.attempts) {
      throw badRequest("Maximum attempts reached");
    }

    // Auto-grade quiz
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question: any) => {
      totalPoints += question.points;
      const studentAnswer = answers.find(
        (a: any) => a.questionId === question._id.toString(),
      );

      if (studentAnswer) {
        if (Array.isArray(studentAnswer.answer)) {
          // Multiple select - check if arrays match
          const correctArray = question.correctAnswer
            .split(",")
            .map((s: string) => s.trim());
          const sortedStudent = [...studentAnswer.answer].sort();
          const sortedCorrect = [...correctArray].sort();
          if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
            score += question.points;
          }
        } else if (studentAnswer.answer === question.correctAnswer) {
          score += question.points;
        }
      }
    });

    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const submission = await QuizSubmission.create({
      quiz: quizId,
      student: studentId,
      answers,
      score,
      totalPoints,
      percentage,
      passed,
      attempt: existingAttempts + 1,
      submittedAt: new Date(),
      gradedAt: new Date(),
    });

    await logActivity({
      userId: studentId,
      action: "Submitted quiz",
      details: `Submitted quiz: ${quiz.title}`,
      resourceType: "quiz",
      resourceId: quizId,
    });

    try {
      await recomputeAndPersistProgress(
        studentId,
        quiz.category.toString(),
      );
    } catch (err) {
      console.error(
        "Progress recompute after quiz failed:",
        err instanceof Error ? err.message : err,
      );
    }

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      data: { submission },
    });
  },
);

/**
 * Get quiz result for current student
 * @route GET /api/quizzes/:id/result
 */
export const getQuizResult = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = req.params.id;
    const studentId = req.user!._id.toString();

    const submission = await QuizSubmission.findOne({
      quiz: quizId,
      student: studentId,
    })
      .populate("quiz", "title passingScore")
      .sort({ submittedAt: -1 });

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
 * Get all quiz results (tutor/admin)
 * @route GET /api/quizzes/:id/results
 */
export const getQuizResults = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = req.params.id;

    const submissions = await QuizSubmission.find({ quiz: quizId })
      .populate("student", "name email avatar")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: { submissions },
    });
  },
);

/**
 * Get student quiz results (tutor/admin)
 * @route GET /api/quizzes/student/:studentId/results
 */
export const getStudentQuizResults = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { studentId } = req.params;

    const submissions = await QuizSubmission.find({ student: studentId })
      .populate("quiz", "title passingScore")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: { submissions },
    });
  },
);
