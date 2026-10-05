import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getUpcomingClasses,
  getClassRecordings,
} from "../controllers/classes/class.controller.js";
import {
  scheduleClass,
  rescheduleClass,
  cancelClass,
} from "../controllers/classes/schedule.controller.js";
import {
  startClass,
  endClass,
  joinClass,
  leaveClass,
  getSessionDetails,
} from "../controllers/classes/session.controller.js";
import {
  attachRecording,
  uploadRecordingBinary,
  recordingMetadataSchema,
} from "../controllers/classes/recording.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  tutorOrAdmin,
  anyAuthenticated,
} from "../middleware/role.middleware.js";
import { requireTutorAssignment } from "../middleware/category.middleware.js";
import { validateBody, validateParams } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

const createClassSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  scheduledDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Scheduled date must be in the future",
  }),
  duration: z.number().min(15).max(300),
  maxParticipants: z.number().min(1).max(500).optional(),
  isRecordable: z.boolean().optional(),
});

const updateClassSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  scheduledDate: z.string().optional(),
  duration: z.number().min(15).max(300).optional(),
  maxParticipants: z.number().min(1).max(500).optional(),
  status: z.enum(["scheduled", "cancelled"]).optional(),
});

const rescheduleSchema = z.object({
  scheduledDate: z.string().min(1),
  duration: z.number().min(15).max(300).optional(),
});

const classIdSchema = z.object({ id: z.string().min(1) });

router.use(protect);

router.get("/upcoming", anyAuthenticated, getUpcomingClasses);

router.post(
  "/",
  tutorOrAdmin,
  requireTutorAssignment,
  validateBody(createClassSchema),
  createClass,
);

router.get("/", anyAuthenticated, getAllClasses);
router.get(
  "/:id",
  anyAuthenticated,
  validateParams(classIdSchema),
  getClassById,
);

router.put(
  "/:id",
  tutorOrAdmin,
  validateParams(classIdSchema),
  validateBody(updateClassSchema),
  updateClass,
);
router.delete("/:id", tutorOrAdmin, validateParams(classIdSchema), deleteClass);

router.post(
  "/:id/schedule",
  tutorOrAdmin,
  validateParams(classIdSchema),
  scheduleClass,
);
router.put(
  "/:id/reschedule",
  tutorOrAdmin,
  validateParams(classIdSchema),
  validateBody(rescheduleSchema),
  rescheduleClass,
);
router.put(
  "/:id/cancel",
  tutorOrAdmin,
  validateParams(classIdSchema),
  cancelClass,
);

router.get(
  "/:id/recordings",
  anyAuthenticated,
  validateParams(classIdSchema),
  getClassRecordings,
);

router.post(
  "/:id/start",
  tutorOrAdmin,
  validateParams(classIdSchema),
  startClass,
);
router.post("/:id/end", tutorOrAdmin, validateParams(classIdSchema), endClass);

// Binary upload via our API → UTApi (avoids browser CORS with ingest CDN).
// Accept any content-type — global json parser only consumes application/json.
router.post(
  "/:id/recording/upload",
  tutorOrAdmin,
  validateParams(classIdSchema),
  express.raw({ type: () => true, limit: "200mb" }),
  uploadRecordingBinary,
);

router.post(
  "/:id/recording",
  tutorOrAdmin,
  validateParams(classIdSchema),
  validateBody(recordingMetadataSchema),
  attachRecording,
);

router.post(
  "/:id/join",
  anyAuthenticated,
  validateParams(classIdSchema),
  joinClass,
);
router.post(
  "/:id/leave",
  anyAuthenticated,
  validateParams(classIdSchema),
  leaveClass,
);
router.get(
  "/:id/session",
  anyAuthenticated,
  validateParams(classIdSchema),
  getSessionDetails,
);

export default router;
