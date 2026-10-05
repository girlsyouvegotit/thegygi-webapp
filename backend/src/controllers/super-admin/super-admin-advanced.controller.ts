import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  unauthorized,
} from "../../middleware/error.middleware.js";
import type { userRoles } from "../../models/user.model.js";
import * as svc from "../../services/super-admin-advanced.service.js";

const requireSuper = (req: AuthRequest) => {
  if (!req.user || req.user.role !== "super_admin") {
    throw unauthorized("Super-admin access required");
  }
};

const actor = (req: AuthRequest) => ({
  actorId: String(req.user!._id),
  req,
});

/* ---- Hubs ---- */

export const getGrowth = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getGrowthHub();
    res.json({ success: true, data });
  },
);

export const getAcademics = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getAcademicsHub();
    res.json({ success: true, data });
  },
);

export const getContent = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getContentHub();
    res.json({ success: true, data });
  },
);

export const getWorkforce = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getWorkforceHub();
    res.json({ success: true, data });
  },
);

export const getTrust = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getTrustHub();
    res.json({ success: true, data });
  },
);

export const getSystem = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getSystemHub();
    res.json({ success: true, data });
  },
);

export const getSupport = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getSupportHub();
    res.json({ success: true, data });
  },
);

export const getTreasuryQueues = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getTreasuryQueues();
    res.json({ success: true, data });
  },
);

/* ---- People ---- */

export const exportPeople = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const result = await svc.exportPeopleCsv({
      q: String(req.query.q || ""),
      role: String(req.query.role || ""),
      status: String(req.query.status || ""),
    });
    if (req.query.format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
      );
      res.send(result.csv);
      return;
    }
    res.json({ success: true, data: result });
  },
);

export const postBulkActive = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { userIds, isActive } = req.body as {
      userIds: string[];
      isActive: boolean;
    };
    if (typeof isActive !== "boolean") throw badRequest("isActive required");
    const data = await svc.bulkSetActive(userIds, isActive, actor(req));
    res.json({ success: true, data });
  },
);

export const postBulkRole = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { userIds, role } = req.body as {
      userIds: string[];
      role: userRoles;
    };
    const data = await svc.bulkSetRole(userIds, role, actor(req));
    res.json({ success: true, data });
  },
);

export const postForcePasswordReset = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.forcePasswordReset(String(req.params.id), actor(req));
    res.json({
      success: true,
      message: "Password reset token generated",
      data,
    });
  },
);

export const postSoftDeleteUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.softDeleteUser(String(req.params.id), actor(req));
    res.json({ success: true, message: "User soft-deleted", data: { user } });
  },
);

export const postRestoreUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.restoreUser(String(req.params.id), actor(req));
    res.json({ success: true, message: "User restored", data: { user } });
  },
);

export const postUnlockUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.unlockUser(String(req.params.id), actor(req));
    res.json({ success: true, message: "User unlocked", data: { user } });
  },
);

export const postOverridePhotoLock = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.overridePhotoLock(String(req.params.id), actor(req));
    res.json({
      success: true,
      message: "Photo lock overridden",
      data: { user },
    });
  },
);

export const postRevokeSessions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.revokeSessions(String(req.params.id), actor(req));
    res.json({
      success: true,
      message: "Sessions revoked",
      data: { user },
    });
  },
);

export const postGdprExport = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.gdprExport(String(req.params.id), actor(req));
    res.json({ success: true, data });
  },
);

export const postGdprAnonymize = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const user = await svc.gdprAnonymize(String(req.params.id), actor(req));
    res.json({
      success: true,
      message: "User anonymized",
      data: { user },
    });
  },
);

/* ---- Content / live / finance ---- */

export const postRevokeCertificate = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const cert = await svc.revokeCertificate(String(req.params.id), actor(req));
    res.json({
      success: true,
      message: "Certificate revoked",
      data: { certificate: cert },
    });
  },
);

export const postDeleteMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const message = await svc.softDeleteCommunityMessage(
      String(req.params.id),
      actor(req),
    );
    res.json({ success: true, message: "Message deleted", data: { message } });
  },
);

export const postPurgeFailedRecordings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.purgeFailedRecordings(actor(req));
    res.json({ success: true, message: "Failed recordings purged", data });
  },
);

export const postEndAllRooms = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.forceEndAllRooms(actor(req));
    res.json({ success: true, message: "All rooms ended", data });
  },
);

export const patchFeeStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { status } = req.body as {
      status: "paid" | "pending" | "overdue";
    };
    const fee = await svc.updateFeeStatus(
      String(req.params.id),
      status,
      actor(req),
    );
    res.json({ success: true, data: { fee } });
  },
);

export const patchSalaryStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { status } = req.body as { status: "paid" | "pending" };
    const salary = await svc.updateSalaryStatus(
      String(req.params.id),
      status,
      actor(req),
    );
    res.json({ success: true, data: { salary } });
  },
);

export const postReassignMentorship = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { assignmentId, mentorId } = req.body as {
      assignmentId: string;
      mentorId: string;
    };
    const assignment = await svc.reassignMentee(
      assignmentId,
      mentorId,
      actor(req),
    );
    res.json({ success: true, data: { assignment } });
  },
);

export const postBlast = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.blastNotification(req.body, actor(req));
    res.json({ success: true, message: "Blast sent", data });
  },
);

export const postEmergency = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { message } = req.body as { message: string };
    if (!message?.trim()) throw badRequest("message required");
    const data = await svc.emergencyBroadcast({ message }, actor(req));
    res.json({ success: true, message: "Emergency broadcast sent", data });
  },
);

export const putSystem = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const control = await svc.updateAdvancedOrg(req.body, actor(req));
    res.json({
      success: true,
      message: "System controls updated",
      data: { control },
    });
  },
);

export const postReportPreset = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.runReportPreset(String(req.params.key));
    res.json({ success: true, data });
  },
);

export const getSupportTickets = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getSupportHub();
    res.json({ success: true, data });
  },
);

export const postSupportTicket = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const ticket = await svc.createSupportTicket(req.body, actor(req));
    res.status(201).json({ success: true, data: { ticket } });
  },
);

export const patchSupportTicket = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const ticket = await svc.updateSupportTicket(
      String(req.params.id),
      req.body,
      actor(req),
    );
    res.json({ success: true, data: { ticket } });
  },
);

export const postActivateAcademicYear = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const year = await svc.activateAcademicYear(
      String(req.params.id),
      actor(req),
    );
    res.json({
      success: true,
      message: "Academic year activated",
      data: { year },
    });
  },
);

export const patchFeatureRollout = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { percent } = req.body as { percent: number };
    const flag = await svc.setFeatureRollout(
      String(req.params.key),
      percent,
      actor(req),
    );
    res.json({ success: true, data: { flag } });
  },
);
