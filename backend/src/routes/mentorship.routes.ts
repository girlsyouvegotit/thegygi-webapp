import express from "express";
import {
  getMyMentor,
  getMyMentees,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentOptions,
  assignMenteeToMentor,
  unassignMenteeFromMentor,
} from "../controllers/mentorship/mentor.controller.js";
import {
  createSession,
  getSession,
  updateSession,
  cancelSession,
  completeSession,
  getMySessions,
} from "../controllers/mentorship/session.controller.js";
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  addMilestone,
  updateMilestone,
} from "../controllers/mentorship/goal.controller.js";
import {
  createFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/mentorship/feedback.controller.js";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/mentorship/note.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireMentorRole } from "../middleware/mentorship.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { getAllMyFeedback } from "../controllers/mentorship/feedback.controller.js";
import { getAllMyGoals } from "../controllers/mentorship/goal.controller.js";
import { getAllMyNotes } from "../controllers/mentorship/note.controller.js";
import { z } from "zod";

const router = express.Router();

const createAssignmentSchema = z.object({
  mentorId: z.string().min(1),
  categoryId: z.string().min(1),
  maxMentees: z.number().min(1).max(50).optional(),
});

const assignMenteeSchema = z.object({
  mentorId: z.string().min(1),
  studentId: z.string().min(1),
  categoryId: z.string().min(1),
});

const createSessionSchema = z.object({
  menteeId: z.string().min(1),
  categoryId: z.string().min(1),
  topic: z.string().min(3),
  description: z.string().optional(),
  scheduledDate: z.string().transform((s) => new Date(s)),
  duration: z.number().min(15).max(180),
  type: z.enum(["one_on_one", "group"]).optional(),
});

const createGoalSchema = z.object({
  menteeId: z.string().min(1),
  categoryId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  targetDate: z.string().transform((s) => new Date(s)),
  milestones: z.array(z.object({ title: z.string().min(1) })).optional(),
});

const createFeedbackSchema = z.object({
  menteeId: z.string().min(1),
  categoryId: z.string().min(1),
  projectTitle: z.string().min(3),
  technicalSkills: z.number().min(0).max(10),
  uiUx: z.number().min(0).max(10).optional(),
  problemSolving: z.number().min(0).max(10).optional(),
  communication: z.number().min(0).max(10).optional(),
  overall: z.number().min(0).max(10),
  feedback: z.string().min(1),
  recommendations: z.array(z.string()).optional(),
});

const createNoteSchema = z.object({
  menteeId: z.string().min(1),
  content: z.string().min(1),
  sessionId: z.string().optional(),
});

router.use(protect);

// Assignments
router.get("/assignments", adminOnly, getAllAssignments);
router.get("/assignments/options", adminOnly, getAssignmentOptions);
router.post(
  "/assignments/assign-mentee",
  adminOnly,
  validateBody(assignMenteeSchema),
  assignMenteeToMentor,
);
router.delete(
  "/assignments/mentee",
  adminOnly,
  validateBody(assignMenteeSchema),
  unassignMenteeFromMentor,
);
router.post(
  "/assignments",
  adminOnly,
  validateBody(createAssignmentSchema),
  createAssignment,
);
router.put("/assignments/:id", adminOnly, updateAssignment);
router.delete("/assignments/:id", adminOnly, deleteAssignment);

// My mentor / mentees
router.get("/my-mentor", getMyMentor);
router.get("/my-mentees", requireMentorRole, getMyMentees);

// Sessions
router.post(
  "/sessions",
  requireMentorRole,
  validateBody(createSessionSchema),
  createSession,
);
router.get("/sessions/my", getMySessions);
router.get("/sessions/:id", getSession);
router.put("/sessions/:id", requireMentorRole, updateSession);
router.delete("/sessions/:id/cancel", requireMentorRole, cancelSession);
router.post("/sessions/:id/complete", requireMentorRole, completeSession);

// Goals — controllers enforce self/mentor/admin access
router.post(
  "/goals",
  requireMentorRole,
  validateBody(createGoalSchema),
  createGoal,
);

// Mentor-scoped "all mine" endpoints (frontend uses these)
router.get("/feedback", requireMentorRole, getAllMyFeedback);
router.get("/goals", requireMentorRole, getAllMyGoals);
router.get("/notes", requireMentorRole, getAllMyNotes);

router.get("/goals/mentee/:menteeId", getGoals);
router.put("/goals/:id", requireMentorRole, updateGoal);
router.delete("/goals/:id", requireMentorRole, deleteGoal);
router.post("/goals/:id/milestones", requireMentorRole, addMilestone);
router.put("/milestones/:id", requireMentorRole, updateMilestone);

// Feedback — controllers enforce self/mentor/admin access
router.post(
  "/feedback",
  requireMentorRole,
  validateBody(createFeedbackSchema),
  createFeedback,
);
router.get("/feedback/mentee/:menteeId", getFeedback);
router.put("/feedback/:id", requireMentorRole, updateFeedback);
router.delete("/feedback/:id", requireMentorRole, deleteFeedback);

// Notes
router.post(
  "/notes",
  requireMentorRole,
  validateBody(createNoteSchema),
  createNote,
);
router.get("/notes/mentee/:menteeId", requireMentorRole, getNotes);
router.put("/notes/:id", requireMentorRole, updateNote);
router.delete("/notes/:id", requireMentorRole, deleteNote);

export default router;
