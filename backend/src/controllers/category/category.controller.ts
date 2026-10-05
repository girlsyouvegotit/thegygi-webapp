import type { Request, Response } from "express";
import {
  createCategory as createCategoryService,
  getCategoryById as getCategoryByIdService,
  getActiveCategories,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
} from "../../services/category.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  notFound,
} from "../../middleware/error.middleware.js";

/**
 * Create a new category
 * @route POST /api/categories
 */
export const createCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      name,
      description,
      icon,
      bannerImage,
      durationWeeks,
      certificateEnabled,
      certificateTitle,
      completionRules,
    } = req.body;

    const category = await createCategoryService({
      name,
      description,
      icon,
      bannerImage,
      durationWeeks,
      certificateEnabled,
      certificateTitle,
      completionRules,
      createdBy: req.user!._id.toString(),
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created category",
      details: `Created category: ${category.name}`,
      resourceType: "category",
      resourceId: category._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  },
);

/**
 * Get all categories
 * @route GET /api/categories
 */
export const getAllCategories = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await getActiveCategories();

    res.json({
      success: true,
      data: { categories },
    });
  },
);

/**
 * Get category by ID
 * @route GET /api/categories/:id
 */
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const category = await getCategoryByIdService(req.params.id);

    if (!category) {
      throw notFound("Category not found");
    }

    res.json({
      success: true,
      data: { category },
    });
  },
);

/**
 * Update category
 * @route PUT /api/categories/:id
 */
export const updateCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const category = await updateCategoryService(req.params.id, req.body);

    if (!category) {
      throw notFound("Category not found");
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated category",
      details: `Updated category: ${category.name}`,
      resourceType: "category",
      resourceId: category._id.toString(),
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  },
);

/**
 * Delete category (soft delete)
 * @route DELETE /api/categories/:id
 */
export const deleteCategory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const deleted = await deleteCategoryService(req.params.id);

    if (!deleted) {
      throw notFound("Category not found");
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted category",
      details: `Deleted category ID: ${req.params.id}`,
      resourceType: "category",
      resourceId: req.params.id,
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  },
);
