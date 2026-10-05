import type { Response } from "express";
import type { HydratedDocument } from "mongoose";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import Recording from "../../models/recording.model.js";
import LiveClass, { type ILiveClass } from "../../models/live-class.model.js";
import { createRecordingRecord } from "../../services/recording.service.js";
import { logActivity } from "../../services/activity.service.js";
import { storageService } from "../../services/storage.service.js";
import { generateRecordingPath } from "../../config/storage.js";
import { inngest } from "../../inngest/client.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";

const utapi = new UTApi();
const MAX_RECORDING_BYTES = 200 * 1024 * 1024;

export const recordingMetadataSchema = z.object({
  fileKey: z.string().min(1, "fileKey is required"),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_RECORDING_BYTES, "Recording exceeds the 200MB limit"),
  mimeType: z.string().min(1, "mimeType is required"),
});

export type RecordingMetadataInput = z.infer<typeof recordingMetadataSchema>;

const persistRecordingAttachment = async (opts: {
  liveClass: HydratedDocument<ILiveClass>;
  userId: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  durationSeconds?: number;
  recordingStartedAt?: Date;
}): Promise<{
  recordingId: string;
  processingQueued: boolean;
  processingError: string | null;
}> => {
  const {
    liveClass,
    userId,
    fileKey,
    fileSize,
    mimeType,
    durationSeconds,
    recordingStartedAt,
  } = opts;

  let recording = await Recording.findOne({ classId: liveClass._id });

  if (!recording) {
    recording = await createRecordingRecord(
      liveClass._id.toString(),
      liveClass.sessionId?.toString() || liveClass._id.toString(),
      liveClass.category.toString(),
      liveClass.tutor.toString(),
    );
  }

  const format = mimeType.split("/")[1] || "webm";

  recording.storageUrl = fileKey;
  recording.fileSize = fileSize;
  recording.format = format;
  recording.processingStatus = "pending";
  if (typeof durationSeconds === "number" && durationSeconds > 0) {
    recording.duration = durationSeconds;
  }
  if (recordingStartedAt) {
    recording.recordingStartedAt = recordingStartedAt;
  }
  await recording.save();

  if (!liveClass.recordingId) {
    liveClass.recordingId = recording._id;
  }
  // File is on disk — if the room already closed, move into processing.
  if (liveClass.status === "ended" || liveClass.status === "processing") {
    liveClass.status = "processing";
  }
  await liveClass.save();

  await logActivity({
    userId,
    action: "Uploaded class recording",
    details: `Uploaded ${(fileSize / 1024 / 1024).toFixed(
      1,
    )}MB for class: ${liveClass.title}`,
    resourceType: "recording",
    resourceId: recording._id.toString(),
    metadata: {
      size: fileSize,
      classId: liveClass._id.toString(),
      fileKey,
    },
  });

  let processingQueued = false;
  let processingError: string | null = null;

  try {
    await inngest.send({
      name: "recording/process",
      data: {
        recordingId: recording._id.toString(),
        sessionId: recording.sessionId.toString(),
        classId: liveClass._id.toString(),
      },
    });
    processingQueued = true;
  } catch (error) {
    processingError =
      error instanceof Error ? error.message : "unknown inngest error";
    console.error(
      `[recording] Failed to queue Inngest job for ${recording._id.toString()}:`,
      error,
    );
  }

  return {
    recordingId: recording._id.toString(),
    processingQueued,
    processingError,
  };
};

const storeRecordingBytes = async (opts: {
  liveClass: HydratedDocument<ILiveClass>;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<{ fileKey: string; fileSize: number; storage: "uploadthing" | "local" }> => {
  const { liveClass, buffer, filename, mimeType } = opts;
  const fileSize = buffer.length;

  try {
    const file = new File([new Uint8Array(buffer)], filename, {
      type: mimeType,
    });
    const uploaded = await utapi.uploadFiles(file);
    const resultEntry = Array.isArray(uploaded) ? uploaded[0] : uploaded;

    if (resultEntry?.data?.key) {
      return {
        fileKey: resultEntry.data.key,
        fileSize: resultEntry.data.size || fileSize,
        storage: "uploadthing",
      };
    }

    console.error(
      "[recording] UTApi returned no file key:",
      resultEntry?.error ?? resultEntry,
    );
  } catch (error) {
    console.error("[recording] UTApi upload threw:", error);
  }

  // Local fallback so ending a class never depends on UploadThing CDN.
  const extension =
    filename.includes(".")
      ? filename.split(".").pop() || "webm"
      : mimeType.split("/")[1] || "webm";
  const localPath = generateRecordingPath(
    liveClass.category.toString(),
    liveClass._id.toString(),
    liveClass.sessionId?.toString() || liveClass._id.toString(),
    extension,
  );
  await storageService.saveFile(localPath, buffer);
  console.info(`[recording] saved locally at ${localPath}`);
  return { fileKey: localPath, fileSize, storage: "local" };
};

/**
 * Attach an uploaded recording to a class.
 * @route POST /api/classes/:id/recording
 */
export const attachRecording = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Only the tutor can attach a recording");
    }

    if (!liveClass.isRecordable) {
      throw badRequest("This class is not marked as recordable");
    }

    const parsed = recordingMetadataSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { fileKey, fileSize, mimeType } = parsed.data;
    const result = await persistRecordingAttachment({
      liveClass,
      userId: req.user!._id.toString(),
      fileKey,
      fileSize,
      mimeType,
    });

    res.json({
      success: true,
      message: result.processingQueued
        ? "Recording attached and queued for processing"
        : "Recording attached. Processing will start shortly.",
      data: {
        recordingId: result.recordingId,
        fileSize,
        processingQueued: result.processingQueued,
        ...(result.processingError && process.env.NODE_ENV !== "production"
          ? { processingError: result.processingError }
          : {}),
      },
    });
  },
);

/**
 * Upload recording binary through our API → UploadThing (UTApi),
 * with local disk fallback if UploadThing fails.
 * @route POST /api/classes/:id/recording/upload
 */
export const uploadRecordingBinary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw notFound("Class not found");

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Only the tutor can upload a recording");
    }

    if (!liveClass.isRecordable) {
      throw badRequest("This class is not marked as recordable");
    }

    const buffer = Buffer.isBuffer(req.body)
      ? req.body
      : req.body instanceof Uint8Array
        ? Buffer.from(req.body)
        : null;

    if (!buffer || buffer.length === 0) {
      throw badRequest(
        "Recording body is empty. Send raw video/audio bytes with Content-Type video/*.",
      );
    }

    if (buffer.length > MAX_RECORDING_BYTES) {
      throw badRequest("Recording exceeds the 200MB limit");
    }

    const mimeType =
      (typeof req.headers["content-type"] === "string"
        ? req.headers["content-type"].split(";")[0].trim()
        : "") || "video/webm";

    const headerName = req.headers["x-file-name"];
    const filename =
      (typeof headerName === "string" && headerName.trim()) ||
      `class-${liveClass._id.toString()}-${Date.now()}.webm`;

    const durationHeader = req.headers["x-recording-duration"];
    const durationSeconds = Number(
      typeof durationHeader === "string" ? durationHeader : "",
    );
    const startedHeader = req.headers["x-recording-started-at"];
    const recordingStartedAt =
      typeof startedHeader === "string" && startedHeader.trim()
        ? new Date(startedHeader)
        : undefined;

    console.info(
      `[recording] server upload ${(buffer.length / 1024 / 1024).toFixed(2)}MB as ${mimeType}`,
    );

    const stored = await storeRecordingBytes({
      liveClass,
      buffer,
      filename,
      mimeType,
    });

    const result = await persistRecordingAttachment({
      liveClass,
      userId: req.user!._id.toString(),
      fileKey: stored.fileKey,
      fileSize: stored.fileSize,
      mimeType,
      durationSeconds:
        Number.isFinite(durationSeconds) && durationSeconds > 0
          ? Math.round(durationSeconds)
          : undefined,
      recordingStartedAt:
        recordingStartedAt && !Number.isNaN(recordingStartedAt.getTime())
          ? recordingStartedAt
          : undefined,
    });

    res.json({
      success: true,
      message:
        stored.storage === "uploadthing"
          ? "Recording uploaded"
          : "Recording saved locally (UploadThing unavailable)",
      data: {
        recordingId: result.recordingId,
        fileKey: stored.fileKey,
        fileSize: stored.fileSize,
        storage: stored.storage,
        processingQueued: result.processingQueued,
      },
    });
  },
);
