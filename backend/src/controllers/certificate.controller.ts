import type { Response } from "express";
import {
  getStudentCertificates,
  getCertificateById,
  revokeCertificate,
} from "../services/certificate.service.js";
import { getStudentEnrollments } from "../services/enrollment.service.js";
import {
  computeCategoryProgress,
  recomputeAndPersistProgress,
} from "../services/progress.service.js";
import { logActivity } from "../services/activity.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

/**
 * List my certificates
 * @route GET /api/certificates/me
 */
export const listMyCertificates = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const certificates = await getStudentCertificates(
      req.user!._id.toString(),
    );

    res.json({
      success: true,
      data: { certificates },
    });
  },
);

/**
 * Get certificate by id
 * @route GET /api/certificates/:id
 */
export const getCertificate = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const certificate = await getCertificateById(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role,
    );

    res.json({
      success: true,
      data: { certificate },
    });
  },
);

/**
 * Admin revoke certificate
 * @route POST /api/certificates/:id/revoke
 */
export const revokeCertificateHandler = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const certificate = await revokeCertificate(req.params.id);

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Revoked certificate",
      details: `Revoked certificate ${certificate.certificateNumber}`,
      resourceType: "certificate",
      resourceId: certificate._id.toString(),
    });

    res.json({
      success: true,
      message: "Certificate revoked",
      data: { certificate },
    });
  },
);

/**
 * List my enrollments with live progress breakdown
 * @route GET /api/enrollments/me
 */
export const listMyEnrollments = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.user!._id.toString();
    const enrollments = await getStudentEnrollments(studentId, false);

    const withProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const categoryId =
          typeof enrollment.category === "object" && enrollment.category
            ? String((enrollment.category as { _id: unknown })._id)
            : String(enrollment.category);

        let breakdown = null;
        try {
          if (enrollment.status === "active") {
            breakdown = await recomputeAndPersistProgress(
              studentId,
              categoryId,
            );
          } else {
            breakdown = await computeCategoryProgress(studentId, categoryId);
          }
        } catch {
          breakdown = null;
        }

        return {
          ...enrollment.toObject(),
          progress: breakdown?.overall ?? enrollment.progress,
          breakdown,
        };
      }),
    );

    res.json({
      success: true,
      data: { enrollments: withProgress },
    });
  },
);
