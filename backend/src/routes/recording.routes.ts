import express from "express";
import {
  getAllRecordings,
  getRecordingByIdHandler,
  getRecordingChat,
  deleteRecording,
} from "../controllers/recordings/recording.controller.js";
import {
  getPlaybackUrl,
  streamRecording,
  downloadRecording,
} from "../controllers/recordings/playback.controller.js";
import { getTranscript } from "../controllers/recordings/transcript.controller.js";
import { searchRecording } from "../controllers/recordings/search.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";
import {
  requireRecordingAccess,
  requireRecordingDownload,
} from "../middleware/recording.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllRecordings);

// Download BEFORE /:id
router.get(
  "/:id/download",
  requireRecordingAccess,
  requireRecordingDownload,
  downloadRecording,
);

router.get("/:id/search", requireRecordingAccess, searchRecording);
router.get("/:id/transcript", requireRecordingAccess, getTranscript);
router.get("/:id/chat", requireRecordingAccess, getRecordingChat);
router.get("/:id/play", requireRecordingAccess, getPlaybackUrl);
router.get("/:id/stream", requireRecordingAccess, streamRecording);
router.get("/:id", requireRecordingAccess, getRecordingByIdHandler);
router.delete("/:id", adminOnly, deleteRecording);

export default router;
