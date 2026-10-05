import mongoose from "mongoose";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import LiveClass from "../models/live-class.model.js";
import Recording from "../models/recording.model.js";
import QuizSubmission from "../models/quiz-submission.model.js";
import Quiz from "../models/quiz.model.js";
import AssignmentSubmission from "../models/assignment-submission.model.js";
import Attendance from "../models/attendance.model.js";
import MentorshipGoal from "../models/mentorship-goal.model.js";
import MentorshipSession from "../models/mentorship-session.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import Enrollment from "../models/enrollment.model.js";

export const getStudentProgress = async (studentId: string) => {
  const [attendance, quizSubmissions, assignmentSubmissions, goals] =
    await Promise.all([
      Attendance.find({ student: studentId }),
      QuizSubmission.find({ student: studentId }),
      AssignmentSubmission.find({ student: studentId }),
      MentorshipGoal.find({ mentee: studentId }),
    ]);

  const present = attendance.filter((a) => a.status === "present").length;

  return {
    attendance: {
      total: attendance.length,
      present,
      late: attendance.filter((a) => a.status === "late").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      percentage: attendance.length
        ? Math.round((present / attendance.length) * 100)
        : 0,
    },
    quizzes: {
      totalQuizzes: quizSubmissions.length,
      averageScore: quizSubmissions.length
        ? Math.round(
            quizSubmissions.reduce((s, q) => s + q.percentage, 0) /
              quizSubmissions.length,
          )
        : 0,
      passed: quizSubmissions.filter((q) => q.passed).length,
    },
    assignments: {
      totalAssignments: assignmentSubmissions.length,
      submitted: assignmentSubmissions.filter((a) => a.status === "submitted")
        .length,
      graded: assignmentSubmissions.filter((a) => a.status === "graded").length,
      averageScore: (() => {
        const graded = assignmentSubmissions.filter(
          (a) => typeof a.score === "number",
        );
        return graded.length
          ? Math.round(
              graded.reduce((s, a) => s + (a.score ?? 0), 0) / graded.length,
            )
          : 0;
      })(),
    },
    mentorship: {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.status === "completed").length,
      activeGoals: goals.filter((g) => g.status === "active").length,
    },
  };
};

/**
 * Resolve category IDs a tutor teaches via assigned categories,
 * denormalized user.categories, and classes they've scheduled.
 *
 * Category association for a tutor can live in three places:
 *   1. Categories of classes they have created
 *   2. `Category.tutors[]` — set by the admin assign-tutor flow and
 *      by `changeUserRole` when a user is promoted to tutor
 *   3. `User.categories[]` — the user's own list, populated at signup
 */
export const getTutorCategoryIds = async (
  tutorId: string,
): Promise<string[]> => {
  const [classes, assignedCategories, tutorUser] = await Promise.all([
    LiveClass.find({ tutor: tutorId }).select("category"),
    Category.find({ tutors: tutorId }).select("_id"),
    User.findById(tutorId).select("categories"),
  ]);

  const categoryIdSet = new Set<string>();
  for (const c of classes) {
    if (c.category) categoryIdSet.add(c.category.toString());
  }
  for (const cat of assignedCategories) {
    categoryIdSet.add(cat._id.toString());
  }
  for (const catId of tutorUser?.categories ?? []) {
    categoryIdSet.add(catId.toString());
  }
  return Array.from(categoryIdSet);
};

/**
 * Students enrolled in a tutor's categories (User.categories + Enrollment).
 */
export const getTutorStudents = async (tutorId: string) => {
  const categoryIds = await getTutorCategoryIds(tutorId);
  if (categoryIds.length === 0) return [];

  const [byUserCategories, enrollments] = await Promise.all([
    User.find({
      role: "student",
      categories: { $in: categoryIds },
    })
      .select("-password")
      .populate("categories", "name slug")
      .lean(),
    Enrollment.find({
      category: { $in: categoryIds },
      status: { $in: ["active", "completed"] },
    })
      .populate({
        path: "student",
        select: "name email avatar bio phone isActive role categories",
        populate: { path: "categories", select: "name slug" },
      })
      .lean(),
  ]);

  const byId = new Map<string, Record<string, unknown>>();

  for (const user of byUserCategories) {
    byId.set(String(user._id), {
      ...user,
      _id: String(user._id),
    });
  }

  for (const enrollment of enrollments) {
    const student = enrollment.student as
      | (Record<string, unknown> & { _id?: { toString: () => string } })
      | null
      | undefined;
    if (!student?._id) continue;
    const id = String(student._id);
    if (byId.has(id)) continue;
    byId.set(id, {
      ...student,
      _id: id,
    });
  }

  return Array.from(byId.values()).sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );
};

/**
 * Tutor analytics: class volume, recordings, attendance, quiz scores,
 * and unique students across the tutor's categories.
 */
export const getTutorAnalytics = async (tutorId: string) => {
  const [classes, recordings, tutorQuizzes, students] = await Promise.all([
    LiveClass.find({ tutor: tutorId }),
    Recording.find({ tutor: tutorId }),
    Quiz.find({ tutor: tutorId }).select("_id"),
    getTutorStudents(tutorId),
  ]);

  const quizIds = tutorQuizzes.map((q) => q._id);
  const classIds = classes.map((c) => c._id);

  const [attendance, submissions] = await Promise.all([
    Attendance.find({ classId: { $in: classIds } }),
    QuizSubmission.find({ quiz: { $in: quizIds } }),
  ]);

  return {
    totalClasses: classes.length,
    totalRecordings: recordings.length,
    totalStudents: students.length,
    averageAttendance: attendance.length
      ? Math.round(
          attendance.reduce((s, a) => s + a.attendancePercentage, 0) /
            attendance.length,
        )
      : 0,
    averageQuizScore: submissions.length
      ? Math.round(
          submissions.reduce((s, q) => s + q.percentage, 0) /
            submissions.length,
        )
      : 0,
  };
};

export const getMentorAnalytics = async (mentorId: string) => {
  const assignments = await MentorAssignment.find({
    mentor: mentorId,
    isActive: true,
  });

  const menteeSet = new Set<string>();
  for (const a of assignments) {
    for (const m of a.mentees) menteeSet.add(m.toString());
  }

  const [goals, sessions] = await Promise.all([
    MentorshipGoal.find({ mentor: mentorId }),
    MentorshipSession.find({ mentor: mentorId }),
  ]);

  return {
    totalMentees: menteeSet.size,
    activeAssignments: assignments.length,
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.status === "completed").length,
    activeGoals: goals.filter((g) => g.status === "active").length,
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === "completed").length,
  };
};

export const getAdminOverview = async () => {
  // Treat missing isActive as active (legacy docs), and use the larger of
  // role-based users vs active enrollments so dashboard counts stay accurate.
  const activeUser = { isActive: { $ne: false } };

  const [
    studentsByRole,
    enrolledStudentIds,
    totalTutors,
    totalMentors,
    totalWriters,
    totalAdmins,
    totalCategories,
    liveClasses,
    totalRecordings,
    activeMentorships,
  ] = await Promise.all([
    User.countDocuments({ role: "student", ...activeUser }),
    Enrollment.distinct("student", { status: "active" }),
    User.countDocuments({ role: "tutor", ...activeUser }),
    User.countDocuments({ role: "mentor", ...activeUser }),
    User.countDocuments({ role: "writer", ...activeUser }),
    User.countDocuments({ role: "admin", ...activeUser }),
    Category.countDocuments({ isActive: { $ne: false } }),
    LiveClass.countDocuments({ status: "live" }),
    Recording.countDocuments({ processingStatus: "ready" }),
    MentorAssignment.countDocuments({ isActive: true }),
  ]);

  const totalStudents = Math.max(studentsByRole, enrolledStudentIds.length);

  return {
    totalStudents,
    totalTutors,
    totalMentors,
    totalWriters,
    totalAdmins,
    totalCategories,
    liveClasses,
    totalRecordings,
    activeMentorships,
  };
};

type CategoryRef = { _id: unknown; name?: string; slug?: string };

/**
 * Platform-wide student performance for admins (all categories / courses).
 * Optional filters: categoryId, search (name/email).
 */
export const getAllStudentsPerformance = async (filters?: {
  categoryId?: string;
  search?: string;
}) => {
  const search = filters?.search?.trim();
  const categoryId = filters?.categoryId;

  const userQuery: Record<string, unknown> = {
    role: "student",
    isActive: { $ne: false },
  };

  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (categoryId) {
    userQuery.categories = categoryId;
  }

  const byRole = await User.find(userQuery)
    .select("name email avatar categories isActive createdAt")
    .populate("categories", "name slug")
    .lean();

  const byId = new Map<
    string,
    {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
      isActive: boolean;
      categories: CategoryRef[];
      createdAt?: Date;
    }
  >();

  for (const u of byRole) {
    byId.set(String(u._id), {
      _id: String(u._id),
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      isActive: u.isActive !== false,
      categories: (u.categories as CategoryRef[]) || [],
      createdAt: u.createdAt,
    });
  }

  // Include students enrolled in a category who may not have it on user.categories
  if (categoryId) {
    const categoryEnrollments = await Enrollment.find({
      category: categoryId,
      status: { $in: ["active", "completed"] },
    })
      .populate({
        path: "student",
        select: "name email avatar categories isActive createdAt role",
        populate: { path: "categories", select: "name slug" },
        ...(search
          ? {
              match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                ],
              },
            }
          : {}),
      })
      .lean();

    for (const enrollment of categoryEnrollments) {
      const student = enrollment.student as
        | {
            _id?: { toString: () => string };
            name?: string;
            email?: string;
            avatar?: string;
            isActive?: boolean;
            categories?: CategoryRef[];
            createdAt?: Date;
            role?: string;
          }
        | null
        | undefined;
      if (!student?._id) continue;
      if (student.role && student.role !== "student") continue;
      const id = String(student._id);
      if (byId.has(id)) continue;
      byId.set(id, {
        _id: id,
        name: student.name || "Student",
        email: student.email || "",
        avatar: student.avatar,
        isActive: student.isActive !== false,
        categories: student.categories || [],
        createdAt: student.createdAt,
      });
    }
  }

  const students = Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (students.length === 0) {
    return {
      students: [],
      summary: {
        totalStudents: 0,
        averageAttendance: 0,
        averageQuizScore: 0,
        averageAssignmentScore: 0,
        averageOverallScore: 0,
      },
    };
  }

  const studentObjectIds = students.map(
    (s) => new mongoose.Types.ObjectId(s._id),
  );

  const [quizAggs, assignmentAggs, attendanceAggs, goalAggs, enrollments] =
    await Promise.all([
      QuizSubmission.aggregate([
        { $match: { student: { $in: studentObjectIds } } },
        {
          $group: {
            _id: "$student",
            totalQuizzes: { $sum: 1 },
            averageScore: { $avg: "$percentage" },
            passed: { $sum: { $cond: ["$passed", 1, 0] } },
          },
        },
      ]),
      AssignmentSubmission.aggregate([
        { $match: { student: { $in: studentObjectIds } } },
        {
          $group: {
            _id: "$student",
            totalAssignments: { $sum: 1 },
            graded: {
              $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] },
            },
            submitted: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["submitted", "graded", "returned", "late"]] },
                  1,
                  0,
                ],
              },
            },
            scoreSum: {
              $sum: {
                $cond: [{ $ne: ["$score", null] }, "$score", 0],
              },
            },
            scoreCount: {
              $sum: {
                $cond: [{ $ne: ["$score", null] }, 1, 0],
              },
            },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { student: { $in: studentObjectIds } } },
        {
          $group: {
            _id: "$student",
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },
          },
        },
      ]),
      MentorshipGoal.aggregate([
        { $match: { mentee: { $in: studentObjectIds } } },
        {
          $group: {
            _id: "$mentee",
            totalGoals: { $sum: 1 },
            completedGoals: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            activeGoals: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
          },
        },
      ]),
      Enrollment.find({
        student: { $in: studentObjectIds },
        status: { $in: ["active", "completed"] },
      })
        .populate("category", "name slug")
        .lean(),
    ]);

  const quizByStudent = new Map(
    quizAggs.map((r) => [String(r._id), r] as const),
  );
  const assignmentByStudent = new Map(
    assignmentAggs.map((r) => [String(r._id), r] as const),
  );
  const attendanceByStudent = new Map(
    attendanceAggs.map((r) => [String(r._id), r] as const),
  );
  const goalsByStudent = new Map(
    goalAggs.map((r) => [String(r._id), r] as const),
  );

  const enrollmentsByStudent = new Map<
    string,
    Array<{
      categoryId: string;
      categoryName: string;
      categorySlug?: string;
      status: string;
      progress: number;
      enrolledAt?: Date;
    }>
  >();

  for (const enrollment of enrollments) {
    const studentId = String(enrollment.student);
    const category = enrollment.category as CategoryRef | null;
    if (!category?._id) continue;
    const list = enrollmentsByStudent.get(studentId) || [];
    list.push({
      categoryId: String(category._id),
      categoryName: category.name || "Category",
      categorySlug: category.slug,
      status: enrollment.status,
      progress: enrollment.progress ?? 0,
      enrolledAt: enrollment.enrolledAt,
    });
    enrollmentsByStudent.set(studentId, list);
  }

  const rows = students.map((student) => {
    const quiz = quizByStudent.get(student._id);
    const assignment = assignmentByStudent.get(student._id);
    const attendance = attendanceByStudent.get(student._id);
    const goals = goalsByStudent.get(student._id);

    const attendanceTotal = attendance?.total ?? 0;
    const present = attendance?.present ?? 0;
    const attendancePercentage = attendanceTotal
      ? Math.round((present / attendanceTotal) * 100)
      : 0;

    const totalQuizzes = quiz?.totalQuizzes ?? 0;
    const averageQuizScore = totalQuizzes
      ? Math.round(quiz?.averageScore ?? 0)
      : 0;
    const passedQuizzes = quiz?.passed ?? 0;

    const totalAssignments = assignment?.totalAssignments ?? 0;
    const gradedAssignments = assignment?.graded ?? 0;
    const submittedAssignments = assignment?.submitted ?? 0;
    const averageAssignmentScore =
      assignment?.scoreCount > 0
        ? Math.round(assignment.scoreSum / assignment.scoreCount)
        : 0;

    const totalGoals = goals?.totalGoals ?? 0;
    const completedGoals = goals?.completedGoals ?? 0;
    const activeGoals = goals?.activeGoals ?? 0;
    const goalCompletionRate = totalGoals
      ? Math.round((completedGoals / totalGoals) * 100)
      : 0;

    const overallScore = Math.round(
      (attendancePercentage + averageQuizScore + goalCompletionRate) / 3,
    );

    const studentEnrollments = enrollmentsByStudent.get(student._id) || [];
    const categoryNames = new Set<string>();
    for (const cat of student.categories || []) {
      if (cat?.name) categoryNames.add(cat.name);
    }
    for (const e of studentEnrollments) {
      categoryNames.add(e.categoryName);
    }

    return {
      _id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      isActive: student.isActive,
      categories: Array.from(categoryNames),
      enrollments: studentEnrollments,
      attendance: {
        total: attendanceTotal,
        present,
        late: attendance?.late ?? 0,
        absent: attendance?.absent ?? 0,
        percentage: attendancePercentage,
      },
      quizzes: {
        totalQuizzes,
        averageScore: averageQuizScore,
        passed: passedQuizzes,
      },
      assignments: {
        totalAssignments,
        submitted: submittedAssignments,
        graded: gradedAssignments,
        averageScore: averageAssignmentScore,
      },
      mentorship: {
        totalGoals,
        completedGoals,
        activeGoals,
        completionRate: goalCompletionRate,
      },
      overallScore,
    };
  });

  const withAttendance = rows.filter((r) => r.attendance.total > 0);
  const withQuizzes = rows.filter((r) => r.quizzes.totalQuizzes > 0);
  const withAssignments = rows.filter((r) => r.assignments.averageScore > 0);

  const avg = (values: number[]) =>
    values.length
      ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
      : 0;

  return {
    students: rows,
    summary: {
      totalStudents: rows.length,
      averageAttendance: avg(withAttendance.map((r) => r.attendance.percentage)),
      averageQuizScore: avg(withQuizzes.map((r) => r.quizzes.averageScore)),
      averageAssignmentScore: avg(
        withAssignments.map((r) => r.assignments.averageScore),
      ),
      averageOverallScore: avg(rows.map((r) => r.overallScore)),
    },
  };
};
