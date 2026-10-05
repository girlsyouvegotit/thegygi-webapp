import Attendance from "../models/attendance.model.js";
import LiveSession from "../models/live-session.model.js";
import LiveClass from "../models/live-class.model.js";
import type { IAttendance } from "../models/attendance.model.js";
import { getDurationInSeconds } from "../utils/date.util.js";
import { recomputeAndPersistProgress } from "./progress.service.js";

/**
 * Calculate attendance for all participants in a session
 */
export const calculateAttendanceForSession = async (
  sessionId: string,
): Promise<void> => {
  const session = await LiveSession.findById(sessionId);
  if (!session || !session.endedAt) {
    throw new Error("Session not found or not ended");
  }

  const totalDuration = getDurationInSeconds(
    session.startedAt,
    session.endedAt,
  );

  for (const participant of session.participants) {
    const joinedAt = participant.joinedAt;
    const leftAt = participant.leftAt || session.endedAt;
    const attendanceDuration = getDurationInSeconds(joinedAt, leftAt);
    const attendancePercentage =
      totalDuration > 0
        ? Math.round((attendanceDuration / totalDuration) * 100)
        : 0;

    // Determine status
    let status: "present" | "late" | "absent" = "present";
    if (attendancePercentage === 0) {
      status = "absent";
    } else if (attendancePercentage < 50) {
      status = "late";
    }

    // Update participant attendance percentage
    participant.attendancePercentage = attendancePercentage;
    await session.save();

    // Create attendance record
    await Attendance.create({
      classId: session.classId,
      sessionId: session._id,
      student: participant.userId,
      category: session.category,
      joinedAt,
      leftAt,
      attendancePercentage,
      status,
      markedBy: "system",
    });

    try {
      await recomputeAndPersistProgress(
        participant.userId.toString(),
        session.category.toString(),
      );
    } catch (err) {
      console.error(
        "Progress recompute after attendance failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
};

/**
 * Get attendance for a class
 */
export const getClassAttendance = async (
  classId: string,
): Promise<IAttendance[]> => {
  return Attendance.find({ classId })
    .populate("student", "name email avatar")
    .sort({ createdAt: -1 });
};

/**
 * Get attendance for a student
 */
export const getStudentAttendance = async (
  studentId: string,
): Promise<IAttendance[]> => {
  return Attendance.find({ student: studentId })
    .populate("classId", "title")
    .populate("category", "name")
    .sort({ createdAt: -1 });
};

/**
 * Get attendance summary for a student
 */
export const getStudentAttendanceSummary = async (
  studentId: string,
): Promise<{
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}> => {
  const attendance = await Attendance.find({ student: studentId });

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "present").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, late, absent, percentage };
};

/**
 * Get attendance summary for a class
 */
export const getClassAttendanceSummary = async (
  classId: string,
): Promise<{
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}> => {
  const attendance = await Attendance.find({ classId });

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "present").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, late, absent, percentage };
};

/**
 * Manually mark attendance
 */
export const manuallyMarkAttendance = async (
  classId: string,
  studentId: string,
  status: "present" | "late" | "absent" | "excused",
  markedBy: string,
): Promise<IAttendance> => {
  return Attendance.create({
    classId,
    student: studentId,
    status,
    markedBy,
    joinedAt: new Date(),
    leftAt: new Date(),
    attendancePercentage:
      status === "present" ? 100 : status === "late" ? 50 : 0,
  });
};
