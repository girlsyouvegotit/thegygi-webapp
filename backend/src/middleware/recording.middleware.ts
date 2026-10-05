import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import Recording from "../models/recording.model.js";
import Category from "../models/category.model.js";
import type { IRecording } from "../models/recording.model.js";
import { notFound, forbidden } from "./error.middleware.js";
import { hasRole } from "./role.middleware.js";

declare module "./auth.middleware.js" {
  interface AuthRequest {
    recording?: IRecording;
  }
}

const getParamId = (param: string | string[] | undefined): string =>
  Array.isArray(param) ? param[0] : (param ?? "");

const categoryIdOf = (category: unknown): string => {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    const c = category as { _id?: unknown };
    if (c._id != null) return String(c._id);
  }
  return String(category);
};

const tutorIdOf = (tutor: unknown): string => {
  if (!tutor) return "";
  if (typeof tutor === "string") return tutor;
  if (typeof tutor === "object" && tutor !== null) {
    const t = tutor as { _id?: unknown };
    if (t._id != null) return String(t._id);
  }
  return String(tutor);
};

const userCategoryIds = (user: AuthRequest["user"]): string[] =>
  (user?.categories || []).map((c) =>
    typeof c === "string" ? c : String((c as { _id?: unknown })._id ?? c),
  );

/**
 * Admin: all recordings.
 * Tutor: recordings they own (recording.tutor or class tutor).
 * Student: recordings in categories they are enrolled in.
 * Mentor: recordings in categories they mentor.
 */
export const requireRecordingAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw forbidden("Not authorized");

    const recordingId = getParamId(req.params.id);
    const recording = await Recording.findById(recordingId)
      .populate("classId", "title tutor")
      .populate("category", "name");

    if (!recording) throw notFound("Recording not found");

    if (hasRole(user, ["admin"])) {
      req.recording = recording;
      return next();
    }

    if (user.role === "tutor") {
      const ownerTutor = tutorIdOf(recording.tutor);
      const classTutor = tutorIdOf(
        (recording.classId as { tutor?: unknown } | null)?.tutor,
      );
      if (
        ownerTutor === user._id.toString() ||
        classTutor === user._id.toString()
      ) {
        req.recording = recording;
        return next();
      }
    }

    if (user.role === "student") {
      const catId = categoryIdOf(recording.category);
      const enrolled = userCategoryIds(user).includes(catId);
      if (enrolled) {
        req.recording = recording;
        return next();
      }
    }

    if (user.role === "mentor") {
      const catId = categoryIdOf(recording.category);
      const cat = await Category.findOne({ _id: catId, mentors: user._id });
      if (cat) {
        req.recording = recording;
        return next();
      }
    }

    throw forbidden("Not authorized to access this recording");
  } catch (err) {
    next(err);
  }
};

export const requireRecordingDownload = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!hasRole(req.user, ["admin"])) {
      throw forbidden("Only admins can download recordings");
    }
    next();
  } catch (err) {
    next(err);
  }
};
