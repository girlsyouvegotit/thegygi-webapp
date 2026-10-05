import type { HydratedDocument } from "mongoose";
import Recording from "../models/recording.model.js";
import LiveSession from "../models/live-session.model.js";
import LiveClass from "../models/live-class.model.js";
import type { IRecording } from "../models/recording.model.js";

/**
 * Create a recording record when class starts.
 *
 * Returns the hydrated Mongoose document (what `Recording.create()`
 * actually returns), not the bare IRecording interface. This keeps
 * callers working with the fully-typed document — with `_id`, `save()`,
 * and the correct `toJSON()` signature.
 */
export const createRecordingRecord = async (
  classId: string,
  sessionId: string,
  categoryId: string,
  tutorId: string,
): Promise<HydratedDocument<IRecording>> => {
  // storageUrl stays empty until the tutor uploads bytes — avoids AI
  // processing against a placeholder path when the class ends first.
  const recording = await Recording.create({
    classId,
    sessionId,
    category: categoryId,
    tutor: tutorId,
    storageUrl: "",
    processingStatus: "pending",
  });

  await Promise.all([
    LiveClass.findByIdAndUpdate(classId, {
      recordingId: recording._id,
    }),
    LiveSession.findByIdAndUpdate(sessionId, {
      recordingId: recording._id,
      recordingStarted: false,
    }),
  ]);

  return recording;
};

/**
 * Update recording status
 */
export const updateRecordingStatus = async (
  recordingId: string,
  status: "pending" | "processing" | "ready" | "failed",
): Promise<void> => {
  await Recording.findByIdAndUpdate(recordingId, { processingStatus: status });
};

/**
 * Save processed recording data
 */
export const saveProcessedRecording = async (
  recordingId: string,
  data: {
    storageUrl: string;
    thumbnailUrl?: string;
    duration: number;
    transcript: string;
    chapters: any[];
    summary: string;
    aiNotes: string;
    practiceQuestions: any[];
  },
): Promise<IRecording | null> => {
  return Recording.findByIdAndUpdate(
    recordingId,
    {
      ...data,
      processingStatus: "ready",
    },
    { new: true },
  );
};

/**
 * Get recording by ID
 */
export const getRecordingById = async (
  recordingId: string,
): Promise<IRecording | null> => {
  return Recording.findById(recordingId)
    .populate("classId", "title description")
    .populate("category", "name slug")
    .populate("tutor", "name email avatar");
};

/** True when a recording has an uploaded file viewers can play. */
export const isRecordingPlayable = (recording: {
  fileSize?: number | null;
  storageUrl?: string | null;
  processingStatus?: string | null;
}): boolean => {
  if (recording.processingStatus === "archived") return false;
  if (typeof recording.fileSize === "number" && recording.fileSize > 0) {
    return Boolean(recording.storageUrl);
  }
  return recording.processingStatus === "ready" && Boolean(recording.storageUrl);
};

/**
 * List recordings with optional category filter.
 * When categoryId is omitted/empty, returns all recordings (admin overview).
 */
export const listRecordings = async (
  options: {
    categoryId?: string;
    categoryIds?: string[];
    tutorId?: string;
    page?: number;
    limit?: number;
    /** Only AI-ready recordings (legacy default for student-facing lists). */
    readyOnly?: boolean;
    /** Uploaded files that can be watched (fileSize > 0), any processing state. */
    availableOnly?: boolean;
  } = {},
): Promise<{ recordings: IRecording[]; total: number }> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    processingStatus: { $ne: "archived" },
  };
  if (options.categoryId) {
    filter.category = options.categoryId;
  } else if (options.categoryIds && options.categoryIds.length > 0) {
    filter.category = { $in: options.categoryIds };
  }
  if (options.tutorId) {
    filter.tutor = options.tutorId;
  }
  if (options.availableOnly) {
    filter.fileSize = { $gt: 0 };
  } else if (options.readyOnly !== false) {
    filter.processingStatus = "ready";
  }

  const [recordings, total] = await Promise.all([
    Recording.find(filter)
      .populate("classId", "title")
      .populate("category", "name slug")
      .populate("tutor", "name avatar")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Recording.countDocuments(filter),
  ]);

  return { recordings, total };
};

/**
 * Get watchable recordings by category (uploaded file present).
 */
export const getRecordingsByCategory = async (
  categoryId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ recordings: IRecording[]; total: number }> => {
  return listRecordings({
    categoryId,
    page,
    limit,
    readyOnly: false,
    availableOnly: true,
  });
};

/**
 * Get recordings by tutor
 */
export const getRecordingsByTutor = async (
  tutorId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ recordings: IRecording[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [recordings, total] = await Promise.all([
    Recording.find({ tutor: tutorId })
      .populate("classId", "title")
      .populate("category", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Recording.countDocuments({ tutor: tutorId }),
  ]);

  return { recordings, total };
};

/**
 * Increment view count
 */
export const incrementViewCount = async (
  recordingId: string,
): Promise<void> => {
  await Recording.findByIdAndUpdate(recordingId, {
    $inc: { viewCount: 1 },
  });
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (
  recordingId: string,
  adminId: string,
): Promise<void> => {
  await Recording.findByIdAndUpdate(recordingId, {
    $inc: { downloadCount: 1 },
    lastDownloadedBy: adminId,
    lastDownloadedAt: new Date(),
  });
};

/**
 * Delete recording
 */
export const deleteRecording = async (recordingId: string): Promise<void> => {
  await Recording.findByIdAndDelete(recordingId);
};

/**
 * Search within recording transcript
 */
export const searchTranscript = async (
  recordingId: string,
  query: string,
): Promise<Array<{ timestamp: string; snippet: string }>> => {
  const recording = await Recording.findById(recordingId).select("transcript");
  if (!recording || !recording.transcript) {
    return [];
  }

  const transcript = recording.transcript;
  const results: Array<{ timestamp: string; snippet: string }> = [];
  const lines = transcript.split("\n");
  const queryLower = query.toLowerCase();

  for (const line of lines) {
    if (line.toLowerCase().includes(queryLower)) {
      // Extract timestamp if exists (format: [HH:MM:SS] or HH:MM:SS)
      const timestampMatch = line.match(/(\[?\d{2}:\d{2}:\d{2}\]?)/);
      const timestamp = timestampMatch
        ? timestampMatch[1].replace(/\[|\]/g, "")
        : "00:00:00";
      const snippet = line.replace(/\[?\d{2}:\d{2}:\d{2}\]?/, "").trim();

      results.push({ timestamp, snippet });
    }
  }

  return results.slice(0, 20); // Limit to 20 results
};
