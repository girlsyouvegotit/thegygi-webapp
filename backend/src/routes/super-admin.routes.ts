import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { superAdminOnly } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";
import {
  forceEndRoom,
  getAdmins,
  getCapabilities,
  getFinance,
  getLive,
  getMentorship,
  getOrgControls,
  getOverview,
  getPeople,
  getPerson,
  getSecurity,
  patchAdmin,
  promoteToAdmin,
  startImpersonation,
  updateOrgControls,
} from "../controllers/super-admin/super-admin.controller.js";
import {
  exportPeople,
  getAcademics,
  getContent,
  getGrowth,
  getSupport,
  getSupportTickets,
  getSystem,
  getTreasuryQueues,
  getTrust,
  getWorkforce,
  patchFeatureRollout,
  patchFeeStatus,
  patchSalaryStatus,
  patchSupportTicket,
  postActivateAcademicYear,
  postBlast,
  postBulkActive,
  postBulkRole,
  postDeleteMessage,
  postEmergency,
  postEndAllRooms,
  postForcePasswordReset,
  postGdprAnonymize,
  postGdprExport,
  postOverridePhotoLock,
  postPurgeFailedRecordings,
  postReassignMentorship,
  postReportPreset,
  postRestoreUser,
  postRevokeCertificate,
  postRevokeSessions,
  postSoftDeleteUser,
  postSupportTicket,
  postUnlockUser,
  putSystem,
} from "../controllers/super-admin/super-admin-advanced.controller.js";
import {
  getHistory,
  getModerationOverview,
  postBan,
  postMessage,
  postSuspend,
  postUnban,
  postUnsuspend,
  postWarn,
  searchTargets,
} from "../controllers/super-admin/moderation.controller.js";

const router = express.Router();

router.use(protect, superAdminOnly);

router.get("/overview", getOverview);
router.get("/capabilities", getCapabilities);

router.get("/people", getPeople);
router.get("/people/export", exportPeople);
router.post(
  "/people/bulk-active",
  validateBody(
    z.object({
      userIds: z.array(z.string().min(1)).min(1),
      isActive: z.boolean(),
    }),
  ),
  postBulkActive,
);
router.post(
  "/people/bulk-role",
  validateBody(
    z.object({
      userIds: z.array(z.string().min(1)).min(1),
      role: z.enum(["student", "tutor", "mentor", "writer", "admin"]),
    }),
  ),
  postBulkRole,
);
router.get("/people/:id", getPerson);
router.post("/people/:id/impersonate", startImpersonation);
router.post("/people/:id/force-password-reset", postForcePasswordReset);
router.post("/people/:id/soft-delete", postSoftDeleteUser);
router.post("/people/:id/restore", postRestoreUser);
router.post("/people/:id/unlock", postUnlockUser);
router.post("/people/:id/override-photo-lock", postOverridePhotoLock);
router.post("/people/:id/revoke-sessions", postRevokeSessions);
router.post("/people/:id/gdpr-export", postGdprExport);
router.post("/people/:id/gdpr-anonymize", postGdprAnonymize);

router.get("/admins", getAdmins);
router.patch(
  "/admins/:id",
  validateBody(
    z.object({
      role: z.enum(["admin", "super_admin"]).optional(),
      capabilities: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  patchAdmin,
);
router.post(
  "/admins/promote",
  validateBody(
    z.object({
      userId: z.string().min(1),
      role: z.enum(["admin", "super_admin"]).optional(),
    }),
  ),
  promoteToAdmin,
);

router.get("/finance", getFinance);
router.get("/treasury/queues", getTreasuryQueues);
router.patch(
  "/finance/fees/:id",
  validateBody(
    z.object({
      status: z.enum(["paid", "pending", "overdue"]),
    }),
  ),
  patchFeeStatus,
);
router.patch(
  "/finance/salaries/:id",
  validateBody(
    z.object({
      status: z.enum(["paid", "pending"]),
    }),
  ),
  patchSalaryStatus,
);

router.get("/mentorship", getMentorship);
router.post(
  "/mentorship/reassign",
  validateBody(
    z.object({
      assignmentId: z.string().min(1),
      mentorId: z.string().min(1),
    }),
  ),
  postReassignMentorship,
);

router.get("/live-ops", getLive);
router.post("/live-ops/rooms/:id/end", forceEndRoom);
router.post("/live-ops/end-all", postEndAllRooms);

router.get("/security", getSecurity);

router.get("/org", getOrgControls);
router.put(
  "/org",
  validateBody(
    z.object({
      maintenanceMode: z.boolean().optional(),
      maintenanceMessage: z.string().optional(),
      bannerEnabled: z.boolean().optional(),
      bannerMessage: z.string().optional(),
      bannerTone: z.enum(["info", "warning", "critical"]).optional(),
      featureFlags: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            description: z.string().optional(),
            enabled: z.boolean(),
            roles: z.array(z.string()).optional(),
            rolloutPercent: z.number().min(0).max(100).optional(),
          }),
        )
        .optional(),
    }),
  ),
  updateOrgControls,
);
router.patch(
  "/org/flags/:key/rollout",
  validateBody(
    z.object({
      percent: z.number().min(0).max(100),
    }),
  ),
  patchFeatureRollout,
);

/* Advanced hubs */
router.get("/growth", getGrowth);
router.get("/academics", getAcademics);
router.get("/content", getContent);
router.get("/workforce", getWorkforce);
router.get("/trust", getTrust);
router.get("/system", getSystem);
router.get("/support", getSupport);

router.put(
  "/system",
  validateBody(
    z.object({
      scheduledMaintenance: z
        .object({
          enabled: z.boolean().optional(),
          startsAt: z.union([z.string(), z.date(), z.null()]).optional(),
          endsAt: z.union([z.string(), z.date(), z.null()]).optional(),
          message: z.string().optional(),
        })
        .optional(),
      ipBlocklist: z.array(z.string()).optional(),
      emailBlocklist: z.array(z.string()).optional(),
      killSwitches: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            enabled: z.boolean(),
          }),
        )
        .optional(),
      experiments: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            enabled: z.boolean(),
            variants: z.array(z.string()),
          }),
        )
        .optional(),
      staffChangelog: z
        .array(
          z.object({
            version: z.string(),
            title: z.string(),
            body: z.string(),
            publishedAt: z.union([z.string(), z.date()]).optional(),
          }),
        )
        .optional(),
      reportPresets: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            description: z.string().optional(),
          }),
        )
        .optional(),
      webhooks: z
        .array(
          z.object({
            name: z.string(),
            url: z.string(),
            enabled: z.boolean(),
            lastStatus: z.string().optional(),
          }),
        )
        .optional(),
      featureFlags: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            description: z.string().optional(),
            enabled: z.boolean(),
            roles: z.array(z.string()).optional(),
            rolloutPercent: z.number().min(0).max(100).optional(),
          }),
        )
        .optional(),
      maintenanceMode: z.boolean().optional(),
      maintenanceMessage: z.string().optional(),
      bannerEnabled: z.boolean().optional(),
      bannerMessage: z.string().optional(),
      bannerTone: z.enum(["info", "warning", "critical"]).optional(),
    }),
  ),
  putSystem,
);
router.post("/system/reports/:key", postReportPreset);

router.post("/certificates/:id/revoke", postRevokeCertificate);
router.post("/content/messages/:id/delete", postDeleteMessage);
router.post("/content/recordings/purge-failed", postPurgeFailedRecordings);

router.post(
  "/comms/blast",
  validateBody(
    z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      roles: z.array(z.string()).optional(),
      userIds: z.array(z.string()).optional(),
    }),
  ),
  postBlast,
);
router.post(
  "/comms/emergency",
  validateBody(
    z.object({
      message: z.string().min(1).max(1000),
    }),
  ),
  postEmergency,
);

router.get("/support/tickets", getSupportTickets);
router.post(
  "/support/tickets",
  validateBody(
    z.object({
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      requesterName: z.string().optional(),
      requesterEmail: z.string().email().optional(),
      user: z.string().optional(),
      assignedTo: z.string().optional(),
      slaDueAt: z.union([z.string(), z.date()]).optional(),
    }),
  ),
  postSupportTicket,
);
router.patch(
  "/support/tickets/:id",
  validateBody(
    z.object({
      subject: z.string().min(1).max(200).optional(),
      body: z.string().min(1).max(10000).optional(),
      status: z
        .enum(["open", "in_progress", "resolved", "closed"])
        .optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      assignedTo: z.string().nullable().optional(),
      slaDueAt: z.union([z.string(), z.date(), z.null()]).optional(),
    }),
  ),
  patchSupportTicket,
);

router.post("/academics/years/:id/activate", postActivateAcademicYear);

/* Moderation */
router.get("/moderation/overview", getModerationOverview);
router.get("/moderation/targets", searchTargets);
router.get("/moderation/users/:id/history", getHistory);
router.post(
  "/moderation/users/:id/message",
  validateBody(
    z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(2000),
      reason: z.string().optional(),
      internalNote: z.string().optional(),
    }),
  ),
  postMessage,
);
router.post(
  "/moderation/users/:id/warn",
  validateBody(
    z.object({
      reason: z.string().min(1).max(1000),
      severity: z
        .enum(["notice", "warning", "final_warning", "critical"])
        .optional(),
      messageTitle: z.string().optional(),
      messageBody: z.string().optional(),
      internalNote: z.string().optional(),
    }),
  ),
  postWarn,
);
router.post(
  "/moderation/users/:id/suspend",
  validateBody(
    z.object({
      reason: z.string().min(1).max(1000),
      duration: z.string().optional(),
      internalNote: z.string().optional(),
    }),
  ),
  postSuspend,
);
router.post(
  "/moderation/users/:id/unsuspend",
  validateBody(
    z.object({
      reason: z.string().optional(),
      internalNote: z.string().optional(),
    }),
  ),
  postUnsuspend,
);
router.post(
  "/moderation/users/:id/ban",
  validateBody(
    z.object({
      reason: z.string().min(1).max(1000),
      internalNote: z.string().optional(),
    }),
  ),
  postBan,
);
router.post(
  "/moderation/users/:id/unban",
  validateBody(
    z.object({
      reason: z.string().min(1).max(1000),
      internalNote: z.string().optional(),
    }),
  ),
  postUnban,
);

export default router;
