import mongoose from "mongoose";
import CategoryChangeRequest from "../models/category-change-request.model.js";
import Category from "../models/category.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import { switchStudentCategory } from "./enrollment.service.js";
import {
  createBulkNotifications,
  createNotification,
} from "./notification.service.js";
import { badRequest, notFound, conflict } from "../middleware/error.middleware.js";

const MIN_REASON_LENGTH = 30;
const LOCK_DAYS = 30;

export const CATEGORY_CHANGE_LOCK_DAYS = LOCK_DAYS;

function assertValidReason(reason: string): string {
  const trimmed = reason.trim().replace(/\s+/g, " ");
  if (trimmed.length < MIN_REASON_LENGTH) {
    throw badRequest(
      `Please explain why you want to change (at least ${MIN_REASON_LENGTH} characters).`,
    );
  }
  if (trimmed.length > 1000) {
    throw badRequest("Reason is too long (max 1000 characters).");
  }
  return trimmed;
}

export async function requestCategoryChange(
  studentId: string,
  toCategoryId: string,
  reasonRaw: string,
) {
  if (!mongoose.Types.ObjectId.isValid(toCategoryId)) {
    throw badRequest("Invalid category");
  }

  const reason = assertValidReason(reasonRaw);

  const student = await User.findById(studentId).select(
    "role isActive categoryChangeLockedUntil",
  );
  if (!student || !student.isActive) throw notFound("Student not found");
  if (student.role !== "student") {
    throw badRequest("Only students can request a category change");
  }

  if (
    student.categoryChangeLockedUntil &&
    student.categoryChangeLockedUntil.getTime() > Date.now()
  ) {
    const until = student.categoryChangeLockedUntil.toLocaleDateString(
      undefined,
      { year: "numeric", month: "short", day: "numeric" },
    );
    throw badRequest(
      `You can’t request another category change until ${until} (30-day lock after your last approved change).`,
    );
  }

  const toCategory = await Category.findById(toCategoryId).select(
    "name isActive",
  );
  if (!toCategory || !toCategory.isActive) {
    throw notFound("Category not found or inactive");
  }

  const active = await Enrollment.findOne({
    student: studentId,
    status: "active",
  }).select("category");

  const fromCategoryId = active?.category?.toString() || null;
  if (fromCategoryId && fromCategoryId === toCategoryId) {
    throw badRequest("You’re already enrolled in that category");
  }

  const pending = await CategoryChangeRequest.findOne({
    student: studentId,
    status: "pending",
  });
  if (pending) {
    throw conflict(
      "You already have a pending category change request. Wait for an admin to review it.",
    );
  }

  const request = await CategoryChangeRequest.create({
    student: studentId,
    fromCategory: fromCategoryId,
    toCategory: toCategoryId,
    reason,
    status: "pending",
  });

  const admins = await User.find({
    role: { $in: ["admin", "super_admin"] },
    isActive: true,
  })
    .select("_id")
    .lean();

  await createBulkNotifications(
    admins.map((a) => String(a._id)),
    {
      type: "announcement",
      title: "Category change request",
      message: `A student requested to switch to ${toCategory.name}. Review required.`,
      link: "/admin/category-changes",
      metadata: { requestId: String(request._id), toCategoryId },
    },
  ).catch(() => undefined);

  await createNotification({
    user: studentId,
    type: "announcement",
    title: "Request submitted",
    message: `Your request to switch to ${toCategory.name} is pending admin approval.`,
    link: "/my-learning",
    metadata: { requestId: String(request._id) },
  }).catch(() => undefined);

  return CategoryChangeRequest.findById(request._id)
    .populate("fromCategory", "name slug icon")
    .populate("toCategory", "name slug icon")
    .populate("student", "name email avatar");
}

export async function listMyCategoryChangeRequests(studentId: string) {
  return CategoryChangeRequest.find({ student: studentId })
    .populate("fromCategory", "name slug icon")
    .populate("toCategory", "name slug icon")
    .sort({ createdAt: -1 })
    .limit(20);
}

export async function listCategoryChangeRequests(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  return CategoryChangeRequest.find(filter)
    .populate("fromCategory", "name slug icon")
    .populate("toCategory", "name slug icon")
    .populate("student", "name email avatar")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
}

export async function approveCategoryChangeRequest(
  requestId: string,
  reviewerId: string,
  reviewNote?: string,
) {
  const request = await CategoryChangeRequest.findById(requestId);
  if (!request) throw notFound("Request not found");
  if (request.status !== "pending") {
    throw badRequest("Only pending requests can be approved");
  }

  const enrollment = await switchStudentCategory(
    request.student.toString(),
    request.toCategory.toString(),
  );

  const lockedUntil = new Date(
    Date.now() + LOCK_DAYS * 24 * 60 * 60 * 1000,
  );
  await User.findByIdAndUpdate(request.student, {
    categoryChangeLockedUntil: lockedUntil,
  });

  request.status = "approved";
  request.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote?.trim() || null;
  await request.save();

  const toCat = await Category.findById(request.toCategory).select("name");
  await createNotification({
    user: request.student.toString(),
    type: "announcement",
    title: "Category change approved",
    message: `You’re now learning ${toCat?.name || "your new category"}. You can’t request another change for ${LOCK_DAYS} days.`,
    link: "/my-learning",
    metadata: {
      requestId: String(request._id),
      categoryId: String(request.toCategory),
      lockedUntil: lockedUntil.toISOString(),
    },
  }).catch(() => undefined);

  return {
    request: await CategoryChangeRequest.findById(request._id)
      .populate("fromCategory", "name slug icon")
      .populate("toCategory", "name slug icon")
      .populate("student", "name email avatar")
      .populate("reviewedBy", "name email"),
    enrollment,
    lockedUntil,
  };
}

export async function rejectCategoryChangeRequest(
  requestId: string,
  reviewerId: string,
  reviewNote?: string,
) {
  const request = await CategoryChangeRequest.findById(requestId);
  if (!request) throw notFound("Request not found");
  if (request.status !== "pending") {
    throw badRequest("Only pending requests can be rejected");
  }

  request.status = "rejected";
  request.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote?.trim() || null;
  await request.save();

  const toCat = await Category.findById(request.toCategory).select("name");
  await createNotification({
    user: request.student.toString(),
    type: "announcement",
    title: "Category change declined",
    message: reviewNote?.trim()
      ? `Your request to switch to ${toCat?.name || "that category"} was declined: ${reviewNote.trim()}`
      : `Your request to switch to ${toCat?.name || "that category"} was declined.`,
    link: "/my-learning",
    metadata: { requestId: String(request._id) },
  }).catch(() => undefined);

  return CategoryChangeRequest.findById(request._id)
    .populate("fromCategory", "name slug icon")
    .populate("toCategory", "name slug icon")
    .populate("student", "name email avatar")
    .populate("reviewedBy", "name email");
}

export async function cancelMyCategoryChangeRequest(
  studentId: string,
  requestId: string,
) {
  const request = await CategoryChangeRequest.findOne({
    _id: requestId,
    student: studentId,
  });
  if (!request) throw notFound("Request not found");
  if (request.status !== "pending") {
    throw badRequest("Only pending requests can be cancelled");
  }
  request.status = "cancelled";
  await request.save();
  return request;
}
