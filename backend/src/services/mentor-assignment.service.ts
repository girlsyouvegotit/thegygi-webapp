import mongoose from "mongoose";
import MentorAssignment from "../models/mentor-assignment.model.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import { createNotification } from "./notification.service.js";
import type { IMentorAssignment } from "../models/mentor-assignment.model.js";
import {
  conflict,
  notFound,
  badRequest,
} from "../middleware/error.middleware.js";

export const createMentorAssignment = async (
  mentorId: string,
  categoryId: string,
  maxMentees: number = 10,
): Promise<IMentorAssignment> => {
  const existing = await MentorAssignment.findOne({
    mentor: mentorId,
    category: categoryId,
  });
  if (existing) throw conflict("Mentor already assigned to this category");

  return MentorAssignment.create({
    mentor: mentorId,
    category: categoryId,
    maxMentees,
  });
};

export const assignMentorToStudent = async (
  studentId: string,
  categoryId: string,
): Promise<IMentorAssignment | null> => {
  const already = await MentorAssignment.findOne({
    category: categoryId,
    mentees: studentId,
    isActive: true,
  });
  if (already) return already;

  const assignment = await MentorAssignment.findOneAndUpdate(
    {
      category: categoryId,
      isActive: true,
      $expr: { $lt: [{ $size: "$mentees" }, "$maxMentees"] },
    },
    { $addToSet: { mentees: studentId } },
    { new: true, sort: { mentees: 1 } },
  );

  if (!assignment) return null;

  await Promise.all([
    createNotification({
      user: assignment.mentor.toString(),
      type: "mentor_assigned",
      title: "New Mentee Assigned",
      message: "A new student has been assigned to you",
      link: "/mentor/mentees",
      metadata: { studentId, categoryId },
    }),
    createNotification({
      user: studentId,
      type: "mentor_assigned",
      title: "Mentor Assigned",
      message: "You have been assigned a mentor",
      link: "/mentorship",
      metadata: { mentorId: assignment.mentor.toString(), categoryId },
    }),
  ]);

  return assignment;
};

async function assertStudentInCategory(
  studentId: string,
  categoryId: string,
): Promise<void> {
  const student = await User.findById(studentId).select("role categories");
  if (!student || student.role !== "student") {
    throw badRequest("Selected user is not a student");
  }

  const onProfile = (student.categories || []).some(
    (id) => id.toString() === categoryId,
  );
  if (onProfile) return;

  const enrolled = await Enrollment.findOne({
    student: studentId,
    category: categoryId,
    status: { $in: ["active", "completed"] },
  }).select("_id");

  if (!enrolled) {
    throw badRequest("Student is not in this category");
  }
}

/**
 * Admin: assign a specific mentor to a specific student within a category.
 * Reassigns if the student already has a different mentor in that category.
 */
export const manuallyAssignMentor = async (
  mentorId: string,
  studentId: string,
  categoryId: string,
): Promise<IMentorAssignment> => {
  if (mentorId === studentId) {
    throw badRequest("Mentor and student must be different users");
  }

  const mentor = await User.findById(mentorId).select("role");
  if (!mentor || mentor.role !== "mentor") {
    throw badRequest("Selected user is not a mentor");
  }

  await assertStudentInCategory(studentId, categoryId);

  const targetShell = await MentorAssignment.findOne({
    mentor: mentorId,
    category: categoryId,
    isActive: true,
  });
  if (!targetShell) {
    throw notFound("Mentor is not assigned to this category");
  }

  const alreadyHere = (targetShell.mentees || []).some(
    (id) => id.toString() === studentId,
  );
  if (alreadyHere) {
    return (await MentorAssignment.findById(targetShell._id)
      .populate("mentor", "name email avatar")
      .populate("category", "name slug")
      .populate("mentees", "name email avatar")) as IMentorAssignment;
  }

  // Move off any other mentor in this category first
  const previous = await MentorAssignment.findOne({
    category: categoryId,
    mentees: studentId,
    isActive: true,
    mentor: { $ne: mentorId },
  });
  if (previous) {
    await MentorAssignment.updateOne(
      { _id: previous._id },
      { $pull: { mentees: studentId } },
    );
  }

  if ((targetShell.mentees?.length || 0) >= targetShell.maxMentees) {
    throw badRequest("Mentor has reached maximum mentee capacity");
  }

  const assignment = await MentorAssignment.findOneAndUpdate(
    {
      _id: targetShell._id,
      isActive: true,
      $expr: { $lt: [{ $size: "$mentees" }, "$maxMentees"] },
    },
    { $addToSet: { mentees: studentId } },
    { new: true },
  )
    .populate("mentor", "name email avatar")
    .populate("category", "name slug")
    .populate("mentees", "name email avatar");

  if (!assignment) {
    throw badRequest("Mentor has reached maximum mentee capacity");
  }

  await Promise.all([
    createNotification({
      user: mentorId,
      type: "mentor_assigned",
      title: "New Mentee Assigned",
      message: "A new student has been assigned to you",
      link: "/mentor/mentees",
      metadata: { studentId, categoryId },
    }),
    createNotification({
      user: studentId,
      type: "mentor_assigned",
      title: "Mentor Assigned",
      message: "You have been assigned a mentor",
      link: "/mentorship",
      metadata: { mentorId, categoryId },
    }),
  ]);

  return assignment;
};

/**
 * Category-scoped mentors (with capacity) and students for admin pickers.
 */
export const getCategoryMentorshipOptions = async (categoryId: string) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw badRequest("Invalid category");
  }

  const [assignments, enrolledIds, studentsByCategory] = await Promise.all([
    MentorAssignment.find({ category: categoryId, isActive: true })
      .populate("mentor", "name email avatar isActive")
      .populate("mentees", "name email avatar")
      .lean(),
    Enrollment.distinct("student", {
      category: categoryId,
      status: { $in: ["active", "completed"] },
    }),
    User.find({
      role: "student",
      categories: categoryId,
      isActive: { $ne: false },
    })
      .select("name email avatar")
      .lean(),
  ]);

  const studentMap = new Map<string, Record<string, unknown>>();
  for (const s of studentsByCategory) {
    studentMap.set(String(s._id), s);
  }

  if (enrolledIds.length > 0) {
    const enrolledStudents = await User.find({
      _id: { $in: enrolledIds },
      role: "student",
      isActive: { $ne: false },
    })
      .select("name email avatar")
      .lean();
    for (const s of enrolledStudents) {
      studentMap.set(String(s._id), s);
    }
  }

  const mentorByStudent = new Map<
    string,
    { mentorId: string; mentorName: string }
  >();
  for (const a of assignments) {
    const mentor = a.mentor as
      | { _id?: { toString: () => string }; name?: string }
      | null;
    if (!mentor?._id) continue;
    for (const m of a.mentees || []) {
      const mentee = m as { _id?: { toString: () => string } } | string;
      const menteeId =
        typeof mentee === "string"
          ? mentee
          : mentee?._id
            ? String(mentee._id)
            : "";
      if (!menteeId) continue;
      mentorByStudent.set(menteeId, {
        mentorId: String(mentor._id),
        mentorName: mentor.name || "Mentor",
      });
    }
  }

  const mentors = assignments
    .map((a) => {
      const mentor = a.mentor as
        | {
            _id?: { toString: () => string };
            name?: string;
            email?: string;
            avatar?: string;
            isActive?: boolean;
          }
        | null;
      if (!mentor?._id || mentor.isActive === false) return null;
      const menteeCount = a.mentees?.length || 0;
      return {
        _id: String(mentor._id),
        name: mentor.name || "Mentor",
        email: mentor.email || "",
        avatar: mentor.avatar,
        assignmentId: String(a._id),
        menteeCount,
        maxMentees: a.maxMentees,
        seatsLeft: Math.max(0, a.maxMentees - menteeCount),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a!.name).localeCompare(String(b!.name)),
    );

  const students = Array.from(studentMap.values())
    .map((s) => {
      const id = String(s._id);
      const current = mentorByStudent.get(id);
      return {
        _id: id,
        name: String(s.name || "Student"),
        email: String(s.email || ""),
        avatar: s.avatar as string | undefined,
        currentMentorId: current?.mentorId || null,
        currentMentorName: current?.mentorName || null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { mentors, students };
};

export const getMentorAssignments = async (
  mentorId: string,
): Promise<IMentorAssignment[]> =>
  MentorAssignment.find({ mentor: mentorId, isActive: true })
    .populate("category", "name slug")
    .populate("mentees", "name email avatar");

export const getStudentMentor = async (
  studentId: string,
  categoryId: string,
): Promise<IMentorAssignment | null> =>
  MentorAssignment.findOne({
    category: categoryId,
    mentees: studentId,
    isActive: true,
  }).populate("mentor", "name email avatar bio");

export const removeMenteeFromMentor = async (
  mentorId: string,
  studentId: string,
  categoryId: string,
): Promise<void> => {
  await MentorAssignment.findOneAndUpdate(
    { mentor: mentorId, category: categoryId },
    { $pull: { mentees: studentId } },
  );
};

export const deactivateMentorAssignment = async (
  assignmentId: string,
): Promise<void> => {
  await MentorAssignment.findByIdAndUpdate(assignmentId, { isActive: false });
};

export const updateMaxMentees = async (
  assignmentId: string,
  maxMentees: number,
): Promise<IMentorAssignment | null> =>
  MentorAssignment.findByIdAndUpdate(
    assignmentId,
    { maxMentees },
    { new: true },
  );
