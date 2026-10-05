import mongoose from "mongoose";
import Testimonial from "../models/testimonial.model.js";
import TestimonialComment from "../models/testimonial-comment.model.js";
import TestimonialLike from "../models/testimonial-like.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import { badRequest, notFound } from "../middleware/error.middleware.js";
import {
  ACCENT_PALETTE,
  TESTIMONIAL_SEED,
} from "../data/testimonial-seed.js";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "GY";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatProgramRole(categoryName: string) {
  const trimmed = categoryName.trim();
  if (!trimmed) return "GYGI Student";
  if (/student$/i.test(trimmed)) return trimmed;
  return `${trimmed} Student`;
}

/** Resolve public role label from the student's active enrolled program. */
export async function resolveStudentProgramRole(studentId: string) {
  const oid = parseObjectId(studentId, "Student");

  const active = await Enrollment.findOne({
    student: oid,
    status: "active",
  })
    .populate("category", "name")
    .lean();

  const activeName =
    active?.category &&
    typeof active.category === "object" &&
    "name" in active.category
      ? String((active.category as { name?: string }).name || "").trim()
      : "";
  if (activeName) return formatProgramRole(activeName);

  const user = await User.findById(oid)
    .select("categories assignedCategories")
    .populate("categories", "name")
    .populate("assignedCategories", "name")
    .lean();

  if (!user) throw notFound("Student not found");

  const firstCategory = [
    ...(Array.isArray(user.categories) ? user.categories : []),
    ...(Array.isArray(user.assignedCategories) ? user.assignedCategories : []),
  ].find(
    (c) =>
      c &&
      typeof c === "object" &&
      "name" in c &&
      typeof (c as { name?: unknown }).name === "string" &&
      String((c as { name: string }).name).trim(),
  ) as { name?: string } | undefined;

  return formatProgramRole(firstCategory?.name || "GYGI");
}

function parseObjectId(raw: string, label = "Testimonial") {
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    throw badRequest(`Invalid ${label.toLowerCase()}`);
  }
  return new mongoose.Types.ObjectId(raw);
}

export function serializeTestimonial(t: {
  _id: unknown;
  name: string;
  role: string;
  body: string;
  country: string;
  flag?: string;
  rating?: number;
  accent?: string;
  accentLight?: string;
  initials?: string;
  status?: string;
  student?: unknown;
  sortOrder?: number;
  createdAt?: Date;
}) {
  return {
    _id: String(t._id),
    id: String(t._id),
    name: t.name,
    role: t.role,
    comment: t.body,
    body: t.body,
    country: t.country,
    flag: t.flag || "🌍",
    rating: t.rating || 5,
    accent: t.accent || "#c147e9",
    accentLight: t.accentLight || "#f3e0fb",
    initials: t.initials || initialsFromName(t.name),
    status: t.status || "approved",
    student: t.student ? String(t.student) : null,
    sortOrder: t.sortOrder ?? 100,
    createdAt: t.createdAt,
  };
}

function serializeComment(c: {
  _id: unknown;
  testimonial: unknown;
  authorName: string;
  body: string;
  isHidden?: boolean;
  adminReply?: {
    body: string;
    authorName: string;
    repliedAt: Date;
  } | null;
  createdAt: Date;
}) {
  return {
    _id: String(c._id),
    testimonialId: String(c.testimonial),
    authorName: c.authorName,
    body: c.body,
    isHidden: Boolean(c.isHidden),
    adminReply: c.adminReply
      ? {
          body: c.adminReply.body,
          authorName: c.adminReply.authorName,
          repliedAt: c.adminReply.repliedAt,
        }
      : null,
    createdAt: c.createdAt,
  };
}

/** Keep one non-student card per name; drop race-insert seed duplicates. */
async function dedupeFeaturedTestimonials() {
  const featured = await Testimonial.find({
    $or: [{ student: null }, { student: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .select("_id name")
    .lean();

  const seen = new Set<string>();
  const dupeIds: mongoose.Types.ObjectId[] = [];
  for (const row of featured) {
    const key = row.name.trim().toLowerCase();
    if (seen.has(key)) {
      dupeIds.push(row._id as mongoose.Types.ObjectId);
    } else {
      seen.add(key);
    }
  }

  if (!dupeIds.length) return;

  await Promise.all([
    TestimonialComment.deleteMany({ testimonial: { $in: dupeIds } }),
    TestimonialLike.deleteMany({ testimonial: { $in: dupeIds } }),
    Testimonial.deleteMany({ _id: { $in: dupeIds } }),
  ]);
}

/**
 * Seed featured stories only on a truly empty collection.
 * Never re-insert names that an admin already deleted.
 */
export async function ensureTestimonialsSeeded() {
  await dedupeFeaturedTestimonials();

  const total = await Testimonial.countDocuments();
  if (total > 0) return;

  try {
    await Testimonial.insertMany(
      TESTIMONIAL_SEED.map((t) => ({
        ...t,
        status: "approved",
        student: null,
        isFeatured: true,
      })),
      { ordered: false },
    );
  } catch (err) {
    // Parallel requests can race on insert; ignore duplicate-key noise.
    const code = (err as { code?: number })?.code;
    if (code !== 11000) throw err;
  }
}

export async function listPublicTestimonials() {
  await ensureTestimonialsSeeded();
  const items = await Testimonial.find({ status: "approved" })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
  return items.map(serializeTestimonial);
}

export async function getEngagement(clientKey?: string) {
  await ensureTestimonialsSeeded();
  const approved = await Testimonial.find({ status: "approved" })
    .select("_id")
    .lean();
  const ids = approved.map((t) => t._id);

  const [likeAgg, commentAgg, likedRows] = await Promise.all([
    TestimonialLike.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { testimonial: { $in: ids } } },
      { $group: { _id: "$testimonial", count: { $sum: 1 } } },
    ]),
    TestimonialComment.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      { $match: { testimonial: { $in: ids }, isHidden: { $ne: true } } },
      { $group: { _id: "$testimonial", count: { $sum: 1 } } },
    ]),
    clientKey
      ? TestimonialLike.find({
          clientKey,
          testimonial: { $in: ids },
        })
          .select("testimonial")
          .lean()
      : Promise.resolve([]),
  ]);

  const likes: Record<string, number> = {};
  const comments: Record<string, number> = {};
  for (const id of ids) {
    likes[String(id)] = 0;
    comments[String(id)] = 0;
  }
  for (const row of likeAgg) likes[String(row._id)] = row.count;
  for (const row of commentAgg) comments[String(row._id)] = row.count;

  return {
    likes,
    comments,
    likedIds: likedRows.map((r) => String(r.testimonial)),
  };
}

export async function toggleLike(testimonialId: string, clientKey: string) {
  const key = clientKey.trim().slice(0, 80);
  if (key.length < 8) throw badRequest("Invalid client key");
  const oid = parseObjectId(testimonialId);
  const story = await Testimonial.findOne({ _id: oid, status: "approved" });
  if (!story) throw notFound("Testimonial not found");

  const existing = await TestimonialLike.findOne({
    testimonial: oid,
    clientKey: key,
  });
  let liked = false;
  if (existing) {
    await existing.deleteOne();
    liked = false;
  } else {
    await TestimonialLike.create({ testimonial: oid, clientKey: key });
    liked = true;
  }

  const likeCount = await TestimonialLike.countDocuments({ testimonial: oid });
  return { liked, likeCount, testimonialId: String(oid) };
}

export async function listPublicComments(testimonialId: string) {
  const oid = parseObjectId(testimonialId);
  const comments = await TestimonialComment.find({
    testimonial: oid,
    isHidden: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return comments.map(serializeComment);
}

export async function createPublicComment(
  testimonialId: string,
  authorName: string,
  body: string,
) {
  const oid = parseObjectId(testimonialId);
  const story = await Testimonial.findOne({ _id: oid, status: "approved" });
  if (!story) throw notFound("Testimonial not found");

  const comment = await TestimonialComment.create({
    testimonial: oid,
    authorName: authorName.trim(),
    body: body.trim(),
    isHidden: false,
  });
  return serializeComment(comment);
}

export async function listAdminComments(opts?: { testimonialId?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts?.testimonialId) {
    filter.testimonial = parseObjectId(opts.testimonialId);
  }
  const comments = await TestimonialComment.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("testimonial", "name")
    .lean();

  return comments.map((c) => ({
    ...serializeComment(c),
    testimonialName:
      c.testimonial &&
      typeof c.testimonial === "object" &&
      "name" in (c.testimonial as object)
        ? String((c.testimonial as { name?: string }).name || "")
        : "",
  }));
}

export async function setCommentHidden(commentId: string, isHidden: boolean) {
  const comment = await TestimonialComment.findById(commentId);
  if (!comment) throw notFound("Comment not found");
  comment.isHidden = isHidden;
  await comment.save();
  return serializeComment(comment);
}

export async function deleteComment(commentId: string) {
  const comment = await TestimonialComment.findById(commentId);
  if (!comment) throw notFound("Comment not found");
  await comment.deleteOne();
  return { deleted: true, _id: commentId };
}

export async function replyToComment(
  commentId: string,
  input: { body: string; authorName: string; repliedBy: string },
) {
  const comment = await TestimonialComment.findById(commentId);
  if (!comment) throw notFound("Comment not found");

  comment.adminReply = {
    body: input.body.trim(),
    authorName: input.authorName.trim(),
    repliedBy: new mongoose.Types.ObjectId(input.repliedBy),
    repliedAt: new Date(),
  };
  await comment.save();
  return serializeComment(comment);
}

export async function upsertStudentTestimonial(input: {
  studentId: string;
  name: string;
  body: string;
  country: string;
  flag?: string;
  rating?: number;
}) {
  const studentOid = parseObjectId(input.studentId, "Student");
  const role = await resolveStudentProgramRole(input.studentId);
  const palette =
    ACCENT_PALETTE[Math.floor(Math.random() * ACCENT_PALETTE.length)];

  const payload = {
    name: input.name.trim(),
    role,
    body: input.body.trim(),
    country: input.country.trim(),
    flag: (input.flag || "🌍").trim().slice(0, 8),
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    accent: palette.accent,
    accentLight: palette.accentLight,
    initials: initialsFromName(input.name),
    student: studentOid,
    status: "approved" as const,
    sortOrder: 50,
  };

  const existing = await Testimonial.findOne({ student: studentOid }).sort({
    createdAt: -1,
  });

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return serializeTestimonial(existing);
  }

  const created = await Testimonial.create(payload);
  return serializeTestimonial(created);
}

export async function getStudentTestimonial(studentId: string) {
  const oid = parseObjectId(studentId, "Student");
  const item = await Testimonial.findOne({ student: oid }).sort({
    createdAt: -1,
  });
  return item ? serializeTestimonial(item) : null;
}

export async function listAdminTestimonials() {
  await ensureTestimonialsSeeded();
  const items = await Testimonial.find({})
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate("student", "name email")
    .lean();
  return items.map((t) => ({
    ...serializeTestimonial(t),
    studentUser:
      t.student && typeof t.student === "object" && "email" in t.student
        ? {
            name: (t.student as { name?: string }).name,
            email: (t.student as { email?: string }).email,
          }
        : null,
  }));
}

export async function setTestimonialStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
) {
  const item = await Testimonial.findById(id);
  if (!item) throw notFound("Testimonial not found");
  item.status = status;
  await item.save();
  return serializeTestimonial(item);
}

export async function deleteTestimonial(id: string) {
  const item = await Testimonial.findById(id);
  if (!item) throw notFound("Testimonial not found");
  const oid = item._id;
  await Promise.all([
    TestimonialComment.deleteMany({ testimonial: oid }),
    TestimonialLike.deleteMany({ testimonial: oid }),
    item.deleteOne(),
  ]);
  return { deleted: true, _id: String(oid) };
}
