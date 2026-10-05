import type { Response } from "express";
import LiveClass from "../../models/live-class.model.js";
import Recording from "../../models/recording.model.js";
import Category from "../../models/category.model.js";
import { logActivity } from "../../services/activity.service.js";
import { notifyClassScheduled } from "../../services/notification.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
} from "../../middleware/error.middleware.js";

/**
 * Create a new class
 * @route POST /api/classes
 */
export const createClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      categoryId,
      title,
      description,
      scheduledDate,
      duration,
      maxParticipants,
      isRecordable,
    } = req.body;

    // Verify tutor is associated with the category.
    //
    // Association can come from either `Category.tutors[]` (the primary
    // read model, populated by the admin assign-tutor flow and by
    // `changeUserRole` on promotion) OR from the tutor's own
    // `User.categories[]` (populated at signup, preserved on role change).
    // Accepting both handles promoted tutors whose migration to
    // `Category.tutors` hasn't run yet.
    if (req.user!.role === "tutor") {
      const category = await Category.findById(categoryId).select("tutors");
      if (!category) {
        throw notFound("Category not found");
      }

      const isAssignedTutor = category.tutors.some(
        (t) => t.toString() === req.user!._id.toString(),
      );
      const hasCategoryOnUser = (req.user!.categories || []).some(
        (c) => c.toString() === categoryId,
      );

      if (!isAssignedTutor && !hasCategoryOnUser) {
        throw forbidden("Not assigned to this category");
      }
    }

    const liveClass = await LiveClass.create({
      category: categoryId,
      tutor: req.user!._id,
      title,
      description,
      scheduledDate,
      duration,
      maxParticipants: maxParticipants || 100,
      isRecordable: isRecordable !== undefined ? isRecordable : true,
      createdBy: req.user!._id,
    });

    // Notify students
    const populated = await Category.findById(categoryId).populate("students");
    if (populated && populated.students.length > 0) {
      await notifyClassScheduled(
        categoryId,
        populated.students.map((s: { _id: { toString: () => string } }) =>
          s._id.toString(),
        ),
        title,
        liveClass._id.toString(),
        scheduledDate,
      );
    }

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created class",
      details: `Created class: ${title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: { class: liveClass },
    });
  },
);

/**
 * Get all classes (role-based)
 * @route GET /api/classes
 */
export const getAllClasses = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    let query: Record<string, unknown> = {};

    if (req.user!.role === "student") {
      query = { category: { $in: req.user!.categories } };
    } else if (req.user!.role === "tutor") {
      query = { tutor: req.user!._id };
    } else if (req.user!.role === "mentor") {
      query = {};
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const classes = await LiveClass.find(query)
      .populate("category", "name slug")
      .populate("tutor", "name email avatar")
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: { classes },
    });
  },
);

/**
 * Get upcoming classes
 * @route GET /api/classes/upcoming
 */
export const getUpcomingClasses = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const query: Record<string, unknown> = {
      scheduledDate: { $gte: new Date() },
      status: "scheduled",
    };

    if (req.user!.role === "student") {
      query.category = { $in: req.user!.categories };
    } else if (req.user!.role === "tutor") {
      query.tutor = req.user!._id;
    }

    const classes = await LiveClass.find(query)
      .populate("category", "name slug")
      .populate("tutor", "name email avatar")
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.json({
      success: true,
      data: { classes },
    });
  },
);

/**
 * Get class by ID
 * @route GET /api/classes/:id
 */
export const getClassById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate("category", "name slug")
      .populate("tutor", "name email avatar");

    if (!liveClass) {
      throw notFound("Class not found");
    }

    res.json({
      success: true,
      data: { class: liveClass },
    });
  },
);

/**
 * Update class
 * @route PUT /api/classes/:id
 */
export const updateClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      throw notFound("Class not found");
    }

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to update this class");
    }

    const updatedClass = await LiveClass.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated class",
      details: `Updated class: ${updatedClass?.title}`,
      resourceType: "class",
      resourceId:
        typeof req.params.id === "string" ? req.params.id : req.params.id[0],
    });

    res.json({
      success: true,
      message: "Class updated",
      data: { class: updatedClass },
    });
  },
);

/**
 * Delete class
 * @route DELETE /api/classes/:id
 */
export const deleteClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      throw notFound("Class not found");
    }

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized to delete this class");
    }

    await LiveClass.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted class",
      details: `Deleted class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id,
    });

    res.json({
      success: true,
      message: "Class deleted",
    });
  },
);

/**
 * Get class recordings
 * @route GET /api/classes/:id/recordings
 *
 * Admin: all recordings for the class
 * Tutor: only if they own the class
 * Student: only if enrolled in the class category
 */
export const getClassRecordings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id).select(
      "tutor category",
    );
    if (!liveClass) throw notFound("Class not found");

    const user = req.user!;
    const userId = user._id.toString();

    if (user.role === "admin") {
      // full access
    } else if (user.role === "tutor") {
      if (liveClass.tutor.toString() !== userId) {
        throw forbidden("Not authorized to view recordings for this class");
      }
    } else if (user.role === "student") {
      const catId = liveClass.category.toString();
      const enrolled = (user.categories || []).some(
        (c) =>
          (typeof c === "string" ? c : String((c as { _id?: unknown })._id ?? c)) ===
          catId,
      );
      if (!enrolled) {
        throw forbidden("Not enrolled in this class's category");
      }
    } else if (user.role === "mentor") {
      const cat = await Category.findOne({
        _id: liveClass.category,
        mentors: user._id,
      }).select("_id");
      if (!cat) {
        throw forbidden("Not authorized to view recordings for this class");
      }
    } else {
      throw forbidden("Not authorized");
    }

    const recordings = await Recording.find({
      classId: req.params.id,
      fileSize: { $gt: 0 },
      processingStatus: { $ne: "archived" },
    })
      .populate("tutor", "name avatar")
      .sort({ date: -1 });

    res.json({
      success: true,
      data: { recordings },
    });
  },
);
