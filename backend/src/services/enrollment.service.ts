import Enrollment from "../models/enrollment.model.js";
import Category from "../models/category.model.js";
import Community from "../models/community.model.js";
import User from "../models/user.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import { assignMentorToStudent } from "./mentor-assignment.service.js";
import { createNotification } from "./notification.service.js";
import { issueCertificate } from "./certificate.service.js";
import { ensurePrivateSelfChannel } from "./community.service.js";
import { badRequest, notFound } from "../middleware/error.middleware.js";
import type { IEnrollment } from "../models/enrollment.model.js";
import mongoose from "mongoose";

const computePhaseEndsAt = (
  durationWeeks?: number | null,
  from: Date = new Date(),
): Date | null => {
  if (!durationWeeks || durationWeeks < 1) return null;
  return new Date(from.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
};

/**
 * Enroll a student in a category
 */
export const enrollStudentInCategory = async (
  studentId: string,
  categoryId: string,
): Promise<IEnrollment> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const category = await Category.findById(categoryId).session(session);
    if (!category || !category.isActive) {
      throw notFound("Category not found or inactive");
    }

    const student = await User.findById(studentId).session(session);
    if (!student || !student.isActive) {
      throw notFound("Student not found or inactive");
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      category: categoryId,
    }).session(session);

    if (existingEnrollment && existingEnrollment.status === "active") {
      await session.abortTransaction();
      return existingEnrollment;
    }

    // One active learning phase at a time — finish current before starting another
    const activeElsewhere = await Enrollment.findOne({
      student: studentId,
      status: "active",
      category: { $ne: categoryId },
    })
      .populate("category", "name")
      .session(session);

    if (activeElsewhere) {
      const activeCategory =
        activeElsewhere.category &&
        typeof activeElsewhere.category === "object" &&
        "name" in activeElsewhere.category
          ? String((activeElsewhere.category as { name: string }).name)
          : "your current category";
      throw badRequest(
        `Complete "${activeCategory}" before enrolling in another category. This keeps your learning focused.`,
      );
    }

    const enrolledAt = new Date();
    const phaseEndsAt = computePhaseEndsAt(category.durationWeeks, enrolledAt);

    let enrollment;
    if (existingEnrollment) {
      enrollment = await Enrollment.findByIdAndUpdate(
        existingEnrollment._id,
        {
          status: "active",
          enrolledAt,
          droppedAt: null,
          completedAt: null,
          progress: 0,
          phaseEndsAt,
        },
        { new: true, session },
      );
    } else {
      enrollment = await Enrollment.create(
        [
          {
            student: studentId,
            category: categoryId,
            status: "active",
            enrolledAt,
            phaseEndsAt,
          },
        ],
        { session },
      );
      enrollment = enrollment[0];
    }

    await Category.findByIdAndUpdate(
      categoryId,
      { $addToSet: { students: studentId } },
      { session },
    );

    const community = await Community.findOne({ category: categoryId }).session(
      session,
    );
    if (community) {
      await Community.findByIdAndUpdate(
        community._id,
        { $addToSet: { members: studentId } },
        { session },
      );
      // Self channel is provisioned after commit (outside session) via ensure below
    }

    await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { categories: categoryId } },
      { session },
    );

    await session.commitTransaction();

    if (community) {
      await ensurePrivateSelfChannel(String(community._id), studentId).catch(
        () => undefined,
      );
    }
    try {
      const mentorAssignment = await assignMentorToStudent(
        studentId,
        categoryId,
      );

      await createNotification({
        user: studentId,
        type: "announcement",
        title: "Enrollment Successful",
        message: `You have been enrolled in ${category.name}`,
        link: "/my-learning",
        metadata: { categoryId, mentorAssigned: !!mentorAssignment },
      });
    } catch (sideEffectError) {
      console.error(
        "Enrollment side-effects failed:",
        sideEffectError instanceof Error
          ? sideEffectError.message
          : sideEffectError,
      );
    }

    return enrollment;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get all enrollments for a student with details
 */
export const getStudentEnrollments = async (
  studentId: string,
  includeInactive: boolean = false,
): Promise<IEnrollment[]> => {
  const query: Record<string, unknown> = { student: studentId };
  if (!includeInactive) {
    query.status = { $in: ["active", "completed"] };
  }

  return Enrollment.find(query)
    .populate(
      "category",
      "name slug description icon bannerImage durationWeeks certificateEnabled certificateTitle completionRules",
    )
    .sort({ enrolledAt: -1 });
};

/**
 * Get all students in a category with progress
 */
export const getCategoryStudents = async (
  categoryId: string,
  status: string = "active",
): Promise<IEnrollment[]> => {
  return Enrollment.find({ category: categoryId, status })
    .populate("student", "name email avatar")
    .populate("category", "name slug")
    .sort({ enrolledAt: 1 });
};

/**
 * Update enrollment progress
 */
export const updateEnrollmentProgress = async (
  studentId: string,
  categoryId: string,
  progress: number,
): Promise<void> => {
  if (progress < 0 || progress > 100) {
    throw badRequest("Progress must be between 0 and 100");
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, category: categoryId, status: "active" },
    { progress },
    { new: true },
  );

  if (!enrollment) {
    throw notFound("Enrollment not found");
  }

  if (progress === 100) {
    await completeEnrollment(studentId, categoryId);
  }
};

/**
 * Drop student from category (enrollment + roster + community + mentor mentee list)
 */
export const dropStudentFromCategory = async (
  studentId: string,
  categoryId: string,
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, category: categoryId, status: "active" },
      { status: "dropped", droppedAt: new Date() },
      { session, new: true },
    );

    if (!enrollment) {
      throw notFound("Active enrollment not found");
    }

    await Category.findByIdAndUpdate(
      categoryId,
      { $pull: { students: studentId } },
      { session },
    );

    await User.findByIdAndUpdate(
      studentId,
      { $pull: { categories: categoryId } },
      { session },
    );

    await Community.updateMany(
      { category: categoryId },
      { $pull: { members: studentId } },
      { session },
    );

    await MentorAssignment.updateMany(
      { category: categoryId, mentees: studentId },
      { $pull: { mentees: studentId } },
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Switch a student's active learning category.
 * Drops any other active enrollment, then enrolls in the new category
 * (community + mentor side-effects via enrollStudentInCategory).
 * Completed enrollments are left untouched.
 */
export const switchStudentCategory = async (
  studentId: string,
  newCategoryId: string,
): Promise<IEnrollment> => {
  if (!mongoose.Types.ObjectId.isValid(newCategoryId)) {
    throw badRequest("Invalid category");
  }

  const category = await Category.findById(newCategoryId).select("name isActive");
  if (!category || !category.isActive) {
    throw notFound("Category not found or inactive");
  }

  const student = await User.findById(studentId).select("role isActive");
  if (!student || !student.isActive) {
    throw notFound("Student not found or inactive");
  }
  if (student.role !== "student") {
    throw badRequest("Only students can switch learning categories");
  }

  const alreadyActive = await Enrollment.findOne({
    student: studentId,
    category: newCategoryId,
    status: "active",
  });
  if (alreadyActive) {
    return alreadyActive;
  }

  const activeElsewhere = await Enrollment.find({
    student: studentId,
    status: "active",
    category: { $ne: newCategoryId },
  }).select("category");

  for (const enrollment of activeElsewhere) {
    await dropStudentFromCategory(
      studentId,
      enrollment.category.toString(),
    );
  }

  const enrollment = await enrollStudentInCategory(studentId, newCategoryId);

  // Prefer active category at index 0 — Community / mentorship UIs read categories[0]
  const userDoc = await User.findById(studentId).select("categories");
  const rest = (userDoc?.categories || []).filter(
    (id) => id.toString() !== newCategoryId,
  );
  await User.findByIdAndUpdate(studentId, {
    categories: [new mongoose.Types.ObjectId(newCategoryId), ...rest],
  });

  await createNotification({
    user: studentId,
    type: "announcement",
    title: "Learning category updated",
    message: `You’re now learning ${category.name}. Community, classes, and mentorship follow this path.`,
    link: "/my-learning",
    metadata: { categoryId: newCategoryId, action: "switch_category" },
  }).catch(() => undefined);

  return enrollment;
};

/**
 * Complete enrollment and issue certificate when enabled
 */
export const completeEnrollment = async (
  studentId: string,
  categoryId: string,
): Promise<void> => {
  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, category: categoryId, status: "active" },
    {
      status: "completed",
      completedAt: new Date(),
      progress: 100,
    },
    { new: true },
  );

  if (!enrollment) {
    throw notFound("Active enrollment not found");
  }

  const category = await Category.findById(categoryId).select("name");

  await createNotification({
    user: studentId,
    type: "announcement",
    title: "Category Completed",
    message: `Congratulations! You have completed ${category?.name || "this category"}`,
    link: `/my-learning`,
    metadata: { categoryId },
  });

  try {
    await issueCertificate(studentId, categoryId, enrollment._id.toString());
  } catch (err) {
    console.error(
      "Certificate issue failed:",
      err instanceof Error ? err.message : err,
    );
  }

  try {
    const { onProgramCompleted } = await import("./post-program.service.js");
    await onProgramCompleted(studentId, categoryId);
  } catch (err) {
    console.error(
      "Post-program unlock failed:",
      err instanceof Error ? err.message : err,
    );
  }
};
