import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import MentorAssignment from "../models/mentor-assignment.model.js";

/**
 * Check if mentor is assigned to a specific mentee
 */
export const requireMentorMenteeRelationship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const mentorId = req.user?._id;
    const menteeId = req.params.menteeId || req.body.menteeId;
    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!mentorId || !menteeId) {
      res.status(400).json({ message: "Mentor and mentee IDs required" });
      return;
    }

    // Admin can access any mentorship
    if (req.user?.role === "admin") {
      next();
      return;
    }

    // Check if mentor is assigned to this mentee
    const assignment = await MentorAssignment.findOne({
      mentor: mentorId,
      mentees: menteeId,
      isActive: true,
    });

    if (!assignment) {
      res.status(403).json({ message: "Not assigned to this mentee" });
      return;
    }

    next();
  } catch (error) {
    console.error("Mentorship middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check if user is a mentor
 */
export const requireMentorRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  if (req.user.role !== "mentor" && req.user.role !== "admin") {
    res.status(403).json({ message: "Only mentors can perform this action" });
    return;
  }

  next();
};
