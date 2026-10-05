import Enrollment from "../models/enrollment.model.js";
import Category from "../models/category.model.js";
import LiveClass from "../models/live-class.model.js";
import Attendance from "../models/attendance.model.js";
import Quiz from "../models/quiz.model.js";
import QuizSubmission from "../models/quiz-submission.model.js";
import Assignment from "../models/assignment.model.js";
import AssignmentSubmission from "../models/assignment-submission.model.js";
import { completeEnrollment } from "./enrollment.service.js";
import type { ICompletionRules } from "../models/category.model.js";

export interface ProgressBreakdown {
  overall: number;
  attendance: {
    score: number;
    attended: number;
    total: number;
  };
  quizzes: {
    score: number;
    passed: number;
    total: number;
  };
  assignments: {
    score: number;
    submitted: number;
    total: number;
  };
  weights: {
    attendance: number;
    quizzes: number;
    assignments: number;
  };
  passThreshold: number;
  phaseEndsAt: Date | null;
  isPastDeadline: boolean;
  canComplete: boolean;
}

const DEFAULT_RULES: ICompletionRules = {
  attendanceWeight: 40,
  quizWeight: 30,
  assignmentWeight: 30,
  passThreshold: 100,
};

const ENDED_CLASS_STATUSES = ["ended", "processing", "recorded"];

/**
 * Redistribute weights when a component has zero items.
 */
const normalizeWeights = (
  rules: ICompletionRules,
  hasAttendance: boolean,
  hasQuizzes: boolean,
  hasAssignments: boolean,
): { attendance: number; quizzes: number; assignments: number } => {
  let attendance = hasAttendance ? rules.attendanceWeight : 0;
  let quizzes = hasQuizzes ? rules.quizWeight : 0;
  let assignments = hasAssignments ? rules.assignmentWeight : 0;
  const total = attendance + quizzes + assignments;

  if (total <= 0) {
    return { attendance: 0, quizzes: 0, assignments: 0 };
  }

  return {
    attendance: (attendance / total) * 100,
    quizzes: (quizzes / total) * 100,
    assignments: (assignments / total) * 100,
  };
};

/**
 * Compute category progress for a student from attendance, quizzes, assignments.
 */
export const computeCategoryProgress = async (
  studentId: string,
  categoryId: string,
): Promise<ProgressBreakdown> => {
  const [category, enrollment, endedClasses, quizzes, assignments] =
    await Promise.all([
      Category.findById(categoryId).lean(),
      Enrollment.findOne({ student: studentId, category: categoryId }).lean(),
      LiveClass.find({
        category: categoryId,
        status: { $in: ENDED_CLASS_STATUSES },
      })
        .select("_id")
        .lean(),
      Quiz.find({ category: categoryId, isActive: true }).select("_id").lean(),
      Assignment.find({ category: categoryId, isActive: true })
        .select("_id")
        .lean(),
    ]);

  const rules: ICompletionRules = {
    ...DEFAULT_RULES,
    ...(category?.completionRules || {}),
  };

  let phaseEndsAt: Date | null = enrollment?.phaseEndsAt
    ? new Date(enrollment.phaseEndsAt)
    : null;

  if (
    !phaseEndsAt &&
    category?.durationWeeks &&
    enrollment?.enrolledAt
  ) {
    phaseEndsAt = new Date(
      new Date(enrollment.enrolledAt).getTime() +
        category.durationWeeks * 7 * 24 * 60 * 60 * 1000,
    );
  }

  const endedClassIds = endedClasses.map((c) => c._id);
  const quizIds = quizzes.map((q) => q._id);
  const assignmentIds = assignments.map((a) => a._id);

  const [attendedClassIds, passedQuizIds, submittedAssignmentIds] =
    await Promise.all([
      endedClassIds.length
        ? Attendance.distinct("classId", {
            student: studentId,
            category: categoryId,
            classId: { $in: endedClassIds },
            status: { $in: ["present", "late", "excused"] },
          })
        : Promise.resolve([]),
      quizIds.length
        ? QuizSubmission.distinct("quiz", {
            student: studentId,
            quiz: { $in: quizIds },
            passed: true,
          })
        : Promise.resolve([]),
      assignmentIds.length
        ? AssignmentSubmission.distinct("assignment", {
            student: studentId,
            assignment: { $in: assignmentIds },
          })
        : Promise.resolve([]),
    ]);

  const attendanceTotal = endedClassIds.length;
  const attendanceAttended = attendedClassIds.length;
  const attendanceScore =
    attendanceTotal > 0
      ? Math.round((attendanceAttended / attendanceTotal) * 100)
      : 0;

  const quizTotal = quizIds.length;
  const quizPassed = passedQuizIds.length;
  const quizScore =
    quizTotal > 0 ? Math.round((quizPassed / quizTotal) * 100) : 0;

  const assignmentTotal = assignmentIds.length;
  const assignmentSubmitted = submittedAssignmentIds.length;
  const assignmentScore =
    assignmentTotal > 0
      ? Math.round((assignmentSubmitted / assignmentTotal) * 100)
      : 0;

  const weights = normalizeWeights(
    rules,
    attendanceTotal > 0,
    quizTotal > 0,
    assignmentTotal > 0,
  );

  let overall = 0;
  if (weights.attendance + weights.quizzes + weights.assignments === 0) {
    overall = 0;
  } else {
    overall = Math.round(
      (attendanceScore * weights.attendance +
        quizScore * weights.quizzes +
        assignmentScore * weights.assignments) /
        100,
    );
  }

  const phaseEndsAtFinal = phaseEndsAt;
  const isPastDeadline = !!(
    phaseEndsAtFinal && Date.now() > phaseEndsAtFinal.getTime()
  );
  const canComplete =
    overall >= rules.passThreshold &&
    !isPastDeadline &&
    enrollment?.status === "active";

  return {
    overall: Math.min(100, Math.max(0, overall)),
    attendance: {
      score: attendanceScore,
      attended: attendanceAttended,
      total: attendanceTotal,
    },
    quizzes: {
      score: quizScore,
      passed: quizPassed,
      total: quizTotal,
    },
    assignments: {
      score: assignmentScore,
      submitted: assignmentSubmitted,
      total: assignmentTotal,
    },
    weights: {
      attendance: Math.round(weights.attendance),
      quizzes: Math.round(weights.quizzes),
      assignments: Math.round(weights.assignments),
    },
    passThreshold: rules.passThreshold,
    phaseEndsAt: phaseEndsAtFinal,
    isPastDeadline,
    canComplete,
  };
};

/**
 * Recompute progress, persist on enrollment, and auto-complete when eligible.
 */
export const recomputeAndPersistProgress = async (
  studentId: string,
  categoryId: string,
): Promise<ProgressBreakdown | null> => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    category: categoryId,
    status: { $in: ["active", "completed"] },
  });

  if (!enrollment) return null;

  // Completed enrollments stay at 100
  if (enrollment.status === "completed") {
    const breakdown = await computeCategoryProgress(studentId, categoryId);
    return { ...breakdown, overall: 100, canComplete: false };
  }

  const breakdown = await computeCategoryProgress(studentId, categoryId);

  enrollment.progress = breakdown.overall;
  if (!enrollment.phaseEndsAt && breakdown.phaseEndsAt) {
    enrollment.phaseEndsAt = breakdown.phaseEndsAt;
  }
  await enrollment.save();

  if (breakdown.canComplete) {
    try {
      await completeEnrollment(studentId, categoryId);
    } catch (err) {
      // Likely already completed by a concurrent recompute
      console.error(
        "Auto-complete enrollment failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return breakdown;
};
