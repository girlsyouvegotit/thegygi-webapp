import type { Request, Response } from "express";
import Quiz from "../../models/quiz.model.js";
import Category from "../../models/category.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";

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

/**
 * Create a quiz
 * @route POST /api/quizzes
 */
export const createQuiz = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      categoryId,
      title,
      description,
      questions,
      duration,
      passingScore,
      attempts,
      startDate,
      endDate,
      isLiveQuiz,
      randomization,
      showAnswers,
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
          "You can only create quizzes for your assigned categories",
        );
      }
    }

    const quiz = await Quiz.create({
      category: categoryId,
      tutor: req.user!._id,
      title,
      description,
      questions,
      duration,
      passingScore,
      attempts,
      startDate,
      endDate,
      isLiveQuiz: isLiveQuiz || false,
      randomization: randomization || false,
      showAnswers: showAnswers !== undefined ? showAnswers : true,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created quiz",
      details: `Created quiz: ${title}`,
      resourceType: "quiz",
      resourceId: quiz._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: { quiz },
    });
  },
);

/**
 * Get all quizzes (role-based)
 * @route GET /api/quizzes
 */
export const getAllQuizzes = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    let query: any = {};

    if (req.user!.role === "student") {
      query = {
        category: { $in: req.user!.categories },
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      };
    } else if (req.user!.role === "tutor") {
      query = { tutor: req.user!._id };
    }

    const quizzes = await Quiz.find(query)
      .select("-questions.correctAnswer")
      .populate("category", "name slug")
      .populate("tutor", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { quizzes },
    });
  },
);

/**
 * Get quizzes by category
 * @route GET /api/quizzes/category/:categoryId
 */
export const getQuizzesByCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    const quizzes = await Quiz.find({
      category: categoryId,
      isActive: true,
    })
      .select("-questions.correctAnswer")
      .populate("tutor", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { quizzes },
    });
  },
);

/**
 * Get quiz by ID
 * @route GET /api/quizzes/:id
 */
export const getQuizById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    let query = Quiz.findById(req.params.id)
      .populate("category", "name slug")
      .populate("tutor", "name email");

    // Hide correct answers for students
    if (req.user!.role === "student") {
      query = query.select("-questions.correctAnswer");
    }

    const quiz = await query;

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    res.json({
      success: true,
      data: { quiz },
    });
  },
);

/**
 * Update quiz
 * @route PUT /api/quizzes/:id
 */
export const updateQuiz = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (
      req.user!.role !== "admin" &&
      req.user!.role !== "super_admin" &&
      quiz.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this quiz");
    }

    const nextCategoryId = req.body.categoryId || req.body.category;
    if (
      req.user!.role === "tutor" &&
      nextCategoryId &&
      String(nextCategoryId) !== String(quiz.category)
    ) {
      const allowed = await assertTutorAssignedToCategory(
        String(nextCategoryId),
        req.user!,
      );
      if (!allowed) {
        throw forbidden(
          "You can only move quizzes to your assigned categories",
        );
      }
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated quiz",
      details: `Updated quiz: ${updatedQuiz?.title}`,
      resourceType: "quiz",
      resourceId: req.params.id,
    });

    res.json({
      success: true,
      message: "Quiz updated",
      data: { quiz: updatedQuiz },
    });
  },
);

/**
 * Delete quiz
 * @route DELETE /api/quizzes/:id
 */
export const deleteQuiz = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (
      req.user!.role !== "admin" &&
      quiz.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this quiz");
    }

    await Quiz.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted quiz",
      details: `Deleted quiz: ${quiz.title}`,
      resourceType: "quiz",
      resourceId: req.params.id,
    });

    res.json({
      success: true,
      message: "Quiz deleted",
    });
  },
);

/**
 * Launch live quiz
 * @route POST /api/quizzes/:id/launch
 */
export const launchLiveQuiz = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { sessionId } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      throw notFound("Quiz not found");
    }

    if (
      req.user!.role !== "admin" &&
      quiz.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to launch this quiz");
    }

    quiz.isLiveQuiz = true;
    await quiz.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Launched live quiz",
      details: `Launched live quiz: ${quiz.title}`,
      resourceType: "quiz",
      resourceId: quiz._id.toString(),
      metadata: { sessionId },
    });

    res.json({
      success: true,
      message: "Live quiz launched",
      data: { quiz },
    });
  },
);
