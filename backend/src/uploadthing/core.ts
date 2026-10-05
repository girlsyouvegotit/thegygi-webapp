import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const upload = createUploadthing();

/**
 * Narrow UploadThing's generic Express request to our AuthRequest.
 *
 * `protect` middleware runs before the UploadThing handler on any
 * route that requires authentication, so `req.user` is populated.
 *
 * `user._id` is typed as `unknown` on the base Mongoose Document
 * interface — `String()` narrows it safely. Both ObjectId and string
 * stringify to the value we want (hex or uuid).
 */
const getUserFromRequest = (req: unknown): { userId: string; role: string } => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    throw new UploadThingError("Unauthorized");
  }

  return {
    userId: String(user._id),
    role: user.role,
  };
};

/**
 * A single FileRouter with two endpoints.
 * The Express handler mounts this whole router at /api/uploadthing,
 * so both endpoints are reachable under the same base URL.
 */
export const uploadRouter = {
  imageUploader: upload({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return getUserFromRequest(req);
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // Prefer ufsUrl (UT v7); fall back to url for older payloads.
      const url =
        (file as { ufsUrl?: string; url?: string }).ufsUrl ||
        (file as { url?: string }).url ||
        "";
      console.log("Image uploaded", {
        userId: metadata.userId,
        key: file.key,
        url,
      });
      return { url, key: file.key };
    }),

  /**
   * Recording uploads for live classes.
   *
   * Files land on UploadThing's CDN. We keep the file KEY (not the URL)
   * as the storage reference, and sign on demand at playback time.
   *
   * 512 MB per file on UploadThing's free tier. Raise to 2GB on paid.
   */
  recordingUploader: upload({
    video: {
      maxFileSize: "512MB",
      maxFileCount: 1,
    },
    audio: {
      maxFileSize: "512MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const auth = getUserFromRequest(req);

      if (auth.role !== "tutor" && auth.role !== "admin") {
        throw new UploadThingError(
          "Only tutors and admins can upload class recordings",
        );
      }

      return auth;
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log("Recording uploaded to UploadThing", {
        userId: metadata.userId,
        key: file.key,
        size: file.size,
      });
      return { key: file.key, url: file.ufsUrl, size: file.size };
    }),
  /**
   * Community chat / DM attachments (images + common docs).
   * Hard cap: 5MB per file.
   */
  chatFileUploader: upload({
    image: { maxFileSize: "5MB", maxFileCount: 4 },
    pdf: { maxFileSize: "5MB", maxFileCount: 4 },
    text: { maxFileSize: "5MB", maxFileCount: 4 },
    blob: { maxFileSize: "5MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => {
      return getUserFromRequest(req);
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const url =
        (file as { ufsUrl?: string; url?: string }).ufsUrl ||
        (file as { url?: string }).url ||
        "";
      console.log("Chat file uploaded", {
        userId: metadata.userId,
        key: file.key,
        url,
        name: file.name,
      });
      return {
        url,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }),

  /**
   * Student assignment file submissions.
   * Hard cap: 5MB per file.
   */
  assignmentFileUploader: upload({
    image: { maxFileSize: "5MB", maxFileCount: 3 },
    pdf: { maxFileSize: "5MB", maxFileCount: 3 },
    text: { maxFileSize: "5MB", maxFileCount: 3 },
    blob: { maxFileSize: "5MB", maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      return getUserFromRequest(req);
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const url =
        (file as { ufsUrl?: string; url?: string }).ufsUrl ||
        (file as { url?: string }).url ||
        "";
      console.log("Assignment file uploaded", {
        userId: metadata.userId,
        key: file.key,
        url,
        name: file.name,
      });
      return {
        url,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;

// Keep the old named export so existing imports don't break.
export const imageFileRouter = uploadRouter;
