import mongoose from "mongoose";
import Enrollment from "../models/enrollment.model.js";
import Community from "../models/community.model.js";
import MentorshipGoal from "../models/mentorship-goal.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import PortfolioReview from "../models/portfolio-review.model.js";
import Category from "../models/category.model.js";
import { badRequest, forbidden, notFound } from "../middleware/error.middleware.js";
import { createNotification } from "./notification.service.js";
import { fetchRelevantJobs } from "./job-feed.service.js";

type PopulatedCategory = {
  _id?: unknown;
  name?: string;
  slug?: string;
  metadata?: { tags?: string[] };
} | null;

/** Flatten category name/slug/tags into job-match inputs. */
function categoryMatchInputs(
  categories: Array<{
    name?: string;
    slug?: string;
    tags?: string[];
  }>,
) {
  const names: string[] = [];
  const labels: string[] = [];
  for (const c of categories) {
    if (c.name) {
      names.push(c.name);
      labels.push(c.name);
    }
    if (c.slug) names.push(c.slug);
    for (const tag of c.tags || []) {
      if (tag?.trim()) names.push(tag.trim());
    }
  }
  return { names, labels };
}

export async function getAlumniStatus(studentId: string) {
  const completed = await Enrollment.find({
    student: studentId,
    status: "completed",
  })
    .populate("category", "name slug metadata.tags")
    .sort({ completedAt: -1 })
    .lean();

  const categories = completed.map((e) => {
    const cat = e.category as PopulatedCategory;
    return {
      enrollmentId: String(e._id),
      categoryId: cat?._id ? String(cat._id) : String(e.category),
      name: cat?.name || "Program",
      slug: cat?.slug || "",
      tags: Array.isArray(cat?.metadata?.tags) ? cat.metadata.tags : [],
      completedAt: e.completedAt,
      progress: e.progress,
    };
  });

  // Backfill alumni channel + career goal for students who completed before this feature.
  for (const cat of categories.slice(0, 3)) {
    await ensureAlumniChannel(cat.categoryId).catch(() => undefined);
    await ensureContinuedMentorship(studentId, cat.categoryId).catch(
      () => undefined,
    );
  }

  return {
    isAlumni: categories.length > 0,
    completedCount: categories.length,
    categories,
  };
}

export async function assertAlumni(studentId: string) {
  const status = await getAlumniStatus(studentId);
  if (!status.isAlumni) {
    throw forbidden(
      "After-graduation features unlock when you complete a program",
    );
  }
  return status;
}

/** Ensure each category community has an Alumni channel. */
export async function ensureAlumniChannel(categoryId: string) {
  const community = await Community.findOne({ category: categoryId });
  if (!community) return null;

  const existing = community.channels.find((c) => c.type === "alumni");
  if (existing) return existing;

  community.channels.push({
    _id: new mongoose.Types.ObjectId(),
    name: "alumni",
    type: "alumni",
    description: "For graduates — career wins, job tips, and alumni support",
    createdAt: new Date(),
  } as any);

  await community.save();
  return community.channels.find((c) => c.type === "alumni") || null;
}

export async function studentCompletedCategory(
  studentId: string,
  categoryId: string,
): Promise<boolean> {
  const row = await Enrollment.findOne({
    student: studentId,
    category: categoryId,
    status: "completed",
  })
    .select("_id")
    .lean();
  return Boolean(row);
}

/** Keep mentorship alive and seed a career goal for alumni. */
export async function ensureContinuedMentorship(
  studentId: string,
  categoryId: string,
) {
  const assignment = await MentorAssignment.findOne({
    category: categoryId,
    mentees: studentId,
    isActive: true,
  });
  if (!assignment) return;

  const existing = await MentorshipGoal.findOne({
    mentee: studentId,
    category: categoryId,
    title: /alumni|career|portfolio|job/i,
    status: "active",
  });
  if (existing) return;

  const target = new Date();
  target.setMonth(target.getMonth() + 3);

  await MentorshipGoal.create({
    mentor: assignment.mentor,
    mentee: studentId,
    category: categoryId,
    title: "Alumni career check-in",
    description:
      "Post-program mentorship: polish your portfolio, practice interviews, and explore job opportunities together.",
    targetDate: target,
    milestones: [
      { title: "Update portfolio / LinkedIn", completed: false },
      { title: "Apply to 3 relevant roles", completed: false },
      { title: "Mock interview with mentor", completed: false },
    ],
    status: "active",
  });

  await createNotification({
    user: studentId,
    type: "goal_updated",
    title: "Continued mentorship",
    message:
      "Your mentor support continues after graduation — a career check-in goal is ready.",
    link: "/mentorship",
    metadata: { categoryId, phase: "alumni" },
  });
}

export async function onProgramCompleted(
  studentId: string,
  categoryId: string,
) {
  await ensureAlumniChannel(categoryId);
  await ensureContinuedMentorship(studentId, categoryId).catch((err) => {
    console.error(
      "Continued mentorship setup failed:",
      err instanceof Error ? err.message : err,
    );
  });

  await createNotification({
    user: studentId,
    type: "announcement",
    title: "After Graduation unlocked",
    message:
      "Alumni community, job matches, portfolio reviews, and continued mentorship are ready for you.",
    link: "/after-graduation",
    metadata: { categoryId },
  });
}

export async function listJobsForStudent(
  studentId: string,
  opts?: { search?: string; limit?: number; categoryId?: string },
) {
  const status = await assertAlumni(studentId);
  let cats = status.categories;
  if (opts?.categoryId) {
    cats = cats.filter((c) => c.categoryId === opts.categoryId);
    if (!cats.length) throw badRequest("Pick a completed program");
  }
  const { names, labels } = categoryMatchInputs(cats);
  return fetchRelevantJobs({
    categoryNames: names,
    categoryLabels: labels,
    search: opts?.search,
    limit: opts?.limit,
  });
}

export async function listMyPortfolioReviews(studentId: string) {
  await assertAlumni(studentId);
  return PortfolioReview.find({ student: studentId })
    .sort({ createdAt: -1 })
    .populate("reviewer", "name avatar")
    .populate("category", "name")
    .lean();
}

export async function submitPortfolioReview(
  studentId: string,
  input: { title: string; url: string; notes?: string; categoryId?: string },
) {
  const status = await assertAlumni(studentId);
  const title = input.title.trim();
  const url = input.url.trim();
  if (title.length < 2) throw badRequest("Add a short title");
  if (!/^https?:\/\//i.test(url)) {
    throw badRequest("Portfolio URL must start with http:// or https://");
  }

  let categoryId = input.categoryId;
  if (categoryId) {
    const ok = status.categories.some((c) => c.categoryId === categoryId);
    if (!ok) throw badRequest("Pick a completed program");
  } else {
    categoryId = status.categories[0]?.categoryId;
  }

  return PortfolioReview.create({
    student: studentId,
    category: categoryId || null,
    title,
    url,
    notes: (input.notes || "").trim(),
    status: "pending",
  });
}

export async function listPendingPortfolioReviews() {
  return PortfolioReview.find({ status: { $in: ["pending", "needs_changes"] } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("student", "name email avatar")
    .populate("category", "name")
    .lean();
}

export async function listAllPortfolioReviews(opts?: { status?: string }) {
  const filter: Record<string, unknown> = {};
  if (
    opts?.status &&
    ["pending", "reviewed", "needs_changes"].includes(opts.status)
  ) {
    filter.status = opts.status;
  }
  return PortfolioReview.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("student", "name email avatar")
    .populate("reviewer", "name email")
    .populate("category", "name")
    .lean();
}

/** Admin/SA: browse jobs matched to live (or selected) course categories. */
export async function listJobsForAdmin(opts?: {
  search?: string;
  limit?: number;
  categoryId?: string;
  categoryNames?: string[];
}) {
  let names = opts?.categoryNames;
  let labels = opts?.categoryNames;

  if (!names?.length) {
    const filter: Record<string, unknown> = { isActive: true };
    if (opts?.categoryId) filter._id = opts.categoryId;

    const cats = await Category.find(filter)
      .select("name slug metadata.tags")
      .lean();

    const mapped = cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      tags: Array.isArray(c.metadata?.tags) ? c.metadata.tags : [],
    }));
    const inputs = categoryMatchInputs(mapped);
    names = inputs.names;
    labels = inputs.labels;
  }

  return fetchRelevantJobs({
    categoryNames: names,
    categoryLabels: labels,
    search: opts?.search,
    limit: opts?.limit ?? 30,
  });
}

/** Admin/SA monitor: alumni graduates, portfolio pipeline, alumni channels. */
export async function getAdminAlumniMonitor() {
  const completed = await Enrollment.find({ status: "completed" })
    .sort({ completedAt: -1 })
    .limit(200)
    .populate("student", "name email avatar isActive")
    .populate("category", "name slug")
    .lean();

  const alumniMap = new Map<
    string,
    {
      studentId: string;
      name: string;
      email: string;
      avatar?: string;
      isActive?: boolean;
      programs: Array<{ name: string; completedAt?: Date | null }>;
      latestCompletedAt?: Date | null;
    }
  >();

  for (const e of completed) {
    const student = e.student as {
      _id?: unknown;
      name?: string;
      email?: string;
      avatar?: string;
      isActive?: boolean;
    } | null;
    const category = e.category as { name?: string } | null;
    if (!student?._id) continue;
    const id = String(student._id);
    const existing = alumniMap.get(id);
    const program = {
      name: category?.name || "Program",
      completedAt: e.completedAt || null,
    };
    if (existing) {
      existing.programs.push(program);
      if (
        e.completedAt &&
        (!existing.latestCompletedAt ||
          e.completedAt > existing.latestCompletedAt)
      ) {
        existing.latestCompletedAt = e.completedAt;
      }
    } else {
      alumniMap.set(id, {
        studentId: id,
        name: student.name || "Student",
        email: student.email || "",
        avatar: student.avatar,
        isActive: student.isActive,
        programs: [program],
        latestCompletedAt: e.completedAt || null,
      });
    }
  }

  const alumni = [...alumniMap.values()].sort((a, b) => {
    const ta = a.latestCompletedAt
      ? new Date(a.latestCompletedAt).getTime()
      : 0;
    const tb = b.latestCompletedAt
      ? new Date(b.latestCompletedAt).getTime()
      : 0;
    return tb - ta;
  });

  const [portfolioAll, pendingCount, reviewedCount, needsChangesCount, communities] =
    await Promise.all([
      PortfolioReview.countDocuments({}),
      PortfolioReview.countDocuments({ status: "pending" }),
      PortfolioReview.countDocuments({ status: "reviewed" }),
      PortfolioReview.countDocuments({ status: "needs_changes" }),
      Community.find({ isActive: true })
        .select("category channels members")
        .populate("category", "name")
        .lean(),
    ]);

  const alumniChannels = communities.map((c) => {
    const cat = c.category as { _id?: unknown; name?: string } | null;
    const channel = (c.channels || []).find((ch) => ch.type === "alumni");
    return {
      communityId: String(c._id),
      categoryId: cat?._id ? String(cat._id) : String(c.category),
      categoryName: cat?.name || "Category",
      hasAlumniChannel: Boolean(channel),
      channelName: channel?.name || null,
      memberCount: Array.isArray(c.members) ? c.members.length : 0,
    };
  });

  // Ensure missing alumni channels are reported; optionally create on demand later
  const missingAlumniChannels = alumniChannels.filter((c) => !c.hasAlumniChannel)
    .length;

  return {
    stats: {
      alumniStudents: alumni.length,
      completedEnrollments: completed.length,
      portfolioTotal: portfolioAll,
      portfolioPending: pendingCount,
      portfolioReviewed: reviewedCount,
      portfolioNeedsChanges: needsChangesCount,
      alumniChannelsReady: alumniChannels.filter((c) => c.hasAlumniChannel)
        .length,
      alumniChannelsMissing: missingAlumniChannels,
    },
    alumni: alumni.slice(0, 100),
    alumniChannels,
  };
}

/** Ensure alumni channels exist for all active communities (admin action). */
export async function ensureAllAlumniChannels() {
  const communities = await Community.find({ isActive: true })
    .select("category")
    .lean();
  let created = 0;
  for (const c of communities) {
    const categoryId = String(c.category);
    const before = await Community.findOne({ category: categoryId })
      .select("channels")
      .lean();
    const had = (before?.channels || []).some((ch) => ch.type === "alumni");
    await ensureAlumniChannel(categoryId);
    if (!had) created += 1;
  }
  return { communities: communities.length, created };
}

export async function reviewPortfolio(
  reviewId: string,
  reviewerId: string,
  input: { status: "reviewed" | "needs_changes"; feedback: string },
) {
  const row = await PortfolioReview.findById(reviewId);
  if (!row) throw notFound("Portfolio submission not found");
  const feedback = input.feedback.trim();
  if (feedback.length < 2) throw badRequest("Add feedback for the student");

  row.status = input.status;
  row.feedback = feedback;
  row.reviewer = new mongoose.Types.ObjectId(reviewerId);
  row.reviewedAt = new Date();
  await row.save();

  await createNotification({
    user: String(row.student),
    type: "mentor_feedback",
    title:
      input.status === "reviewed"
        ? "Portfolio reviewed"
        : "Portfolio needs changes",
    message: feedback.slice(0, 180),
    link: "/after-graduation?tab=portfolio",
    metadata: { portfolioReviewId: String(row._id) },
  });

  return row;
}
