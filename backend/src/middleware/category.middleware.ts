import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import Category from "../models/category.model.js";

/**
 * Check if user is enrolled in a category (for students)
 */
export const requireCategoryEnrollment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.categoryId || req.params.id;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role === "admin") {
      next();
      return;
    }

    if (user.role === "tutor") {
      const category = await Category.findOne({
        _id: categoryId,
        tutors: user._id,
      });
      if (category) {
        next();
        return;
      }
    }

    if (user.role === "student") {
      const isEnrolled = user.categories?.some(
        (catId) => catId.toString() === categoryId,
      );
      if (isEnrolled) {
        next();
        return;
      }
    }

    res.status(403).json({ message: "Not enrolled in this category" });
  } catch (error) {
    console.error("Category middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check if user is a tutor assigned to a category.
 *
 * The tutor's association can live in `Category.tutors[]` (the primary
 * read model) OR — for tutors promoted from student before the role
 * migration ran — in their own `User.categories[]`. Either is valid.
 */
export const requireTutorAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryId = req.params.categoryId || req.body.categoryId;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (user.role === "admin" || user.role === "super_admin") {
      next();
      return;
    }

    if (user.role !== "tutor") {
      res.status(403).json({ message: "Only tutors can perform this action" });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ message: "Category is required" });
      return;
    }

    const category =
      await Category.findById(categoryId).select("tutors students");
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const isAssignedTutor = category.tutors.some(
      (t) => t.toString() === user._id.toString(),
    );
    const hasCategoryOnUser = (user.categories || []).some(
      (c) => c.toString() === categoryId,
    );

    if (!isAssignedTutor && !hasCategoryOnUser) {
      res.status(403).json({
        message: "You can only create content for your assigned categories",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Tutor assignment middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
