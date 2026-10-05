import type { Response } from "express";
import User, {
  ALL_SUPER_ADMIN_CAPABILITIES,
  type SuperAdminCapability,
} from "../../models/user.model.js";
import VideoRoom from "../../models/video-room.model.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  notFound,
  unauthorized,
} from "../../middleware/error.middleware.js";
import { logActivity } from "../../services/activity.service.js";
import {
  buildSuperAdminOverview,
  getAuditLogs,
  getFinanceCommand,
  getLiveOps,
  getMentorshipGraph,
  getOrCreatePlatformControl,
  getPersonDossier,
  listAdmins,
  listPeople,
  updateAdminAccess,
} from "../../services/super-admin.service.js";
import { DEFAULT_FEATURE_FLAGS } from "../../models/platform-control.model.js";
import {
  attachImpersonationCookie,
  generateImpersonationToken,
} from "../../utils/jwt.util.js";
import { roleHomePath } from "../../utils/role-home.util.js";

const requireSuper = (req: AuthRequest) => {
  if (!req.user || req.user.role !== "super_admin") {
    throw unauthorized("Super-admin access required");
  }
};

/** Any super-admin may View as — no target-user consent required. */
const requireCanViewAs = (req: AuthRequest) => {
  requireSuper(req);
};

export const getOverview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const overview = await buildSuperAdminOverview();
    res.json({ success: true, data: { overview } });
  },
);

export const getPeople = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await listPeople({
      q: String(req.query.q || ""),
      role: String(req.query.role || ""),
      status: String(req.query.status || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });
    res.json({ success: true, data });
  },
);

export const getPerson = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const dossier = await getPersonDossier(String(req.params.id));
    if (!dossier) throw notFound("User not found");
    res.json({ success: true, data: dossier });
  },
);

export const getAdmins = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const admins = await listAdmins();
    res.json({
      success: true,
      data: {
        admins,
        capabilities: ALL_SUPER_ADMIN_CAPABILITIES,
      },
    });
  },
);

export const patchAdmin = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { role, capabilities, isActive } = req.body as {
      role?: "admin" | "super_admin";
      capabilities?: SuperAdminCapability[];
      isActive?: boolean;
    };

    if (String(req.params.id) === String(req.user!._id) && isActive === false) {
      throw badRequest("You cannot deactivate your own super-admin account");
    }

    try {
      const user = await updateAdminAccess({
        actorId: String(req.user!._id),
        targetId: String(req.params.id),
        role,
        capabilities,
        isActive,
        req,
      });
      res.json({
        success: true,
        message: "Admin access updated",
        data: { user },
      });
    } catch (e) {
      throw badRequest((e as Error).message || "Failed to update admin");
    }
  },
);

export const promoteToAdmin = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const { userId, role } = req.body as {
      userId: string;
      role?: "admin" | "super_admin";
    };
    if (!userId) throw badRequest("userId is required");

    const target = await User.findById(userId);
    if (!target) throw notFound("User not found");

    const nextRole = role || "admin";
    target.role = nextRole;
    if (nextRole === "super_admin" && !(target.capabilities || []).length) {
      target.capabilities = [...ALL_SUPER_ADMIN_CAPABILITIES];
    }
    await target.save();

    await logActivity({
      userId: String(req.user!._id),
      action: "Promoted user to admin staff",
      details: `${target.email} → ${nextRole}`,
      resourceType: "user",
      resourceId: String(target._id),
      isAudit: true,
      req,
    });

    res.json({
      success: true,
      message: "User promoted",
      data: { user: target },
    });
  },
);

export const getFinance = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const finance = await getFinanceCommand();
    res.json({ success: true, data: { finance } });
  },
);

export const getMentorship = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const graph = await getMentorshipGraph();
    res.json({ success: true, data: graph });
  },
);

export const getLive = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const live = await getLiveOps();
    res.json({ success: true, data: live });
  },
);

export const forceEndRoom = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const room = await VideoRoom.findById(req.params.id);
    if (!room) throw notFound("Room not found");
    room.status = "ended";
    await room.save();

    await logActivity({
      userId: String(req.user!._id),
      action: "Force-ended live room",
      details: `Room ${room._id}`,
      resourceType: "video_room",
      resourceId: String(room._id),
      isAudit: true,
      req,
    });

    res.json({ success: true, message: "Room ended", data: { room } });
  },
);

export const getSecurity = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await getAuditLogs({
      q: String(req.query.q || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 40),
      auditOnly: req.query.auditOnly !== "false",
    });
    res.json({ success: true, data });
  },
);

export const getOrgControls = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const control = await getOrCreatePlatformControl();
    res.json({ success: true, data: { control } });
  },
);

export const updateOrgControls = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const control = await getOrCreatePlatformControl();
    const {
      maintenanceMode,
      maintenanceMessage,
      bannerEnabled,
      bannerMessage,
      bannerTone,
      featureFlags,
    } = req.body as Partial<{
      maintenanceMode: boolean;
      maintenanceMessage: string;
      bannerEnabled: boolean;
      bannerMessage: string;
      bannerTone: "info" | "warning" | "critical";
      featureFlags: typeof DEFAULT_FEATURE_FLAGS;
    }>;

    if (typeof maintenanceMode === "boolean") {
      control.maintenanceMode = maintenanceMode;
    }
    if (typeof maintenanceMessage === "string") {
      control.maintenanceMessage = maintenanceMessage;
    }
    if (typeof bannerEnabled === "boolean") {
      control.bannerEnabled = bannerEnabled;
    }
    if (typeof bannerMessage === "string") {
      control.bannerMessage = bannerMessage;
    }
    if (bannerTone) control.bannerTone = bannerTone;
    if (Array.isArray(featureFlags)) control.featureFlags = featureFlags;
    control.updatedBy = req.user!._id as typeof control.updatedBy;
    await control.save();

    await logActivity({
      userId: String(req.user!._id),
      action: "Updated platform controls",
      details: `maintenance=${control.maintenanceMode}`,
      resourceType: "platform_control",
      resourceId: String(control._id),
      isAudit: true,
      req,
    });

    res.json({
      success: true,
      message: "Platform controls updated",
      data: { control },
    });
  },
);

export const startImpersonation = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireCanViewAs(req);
    if (req.impersonatorId) {
      throw badRequest("Already impersonating someone — exit first");
    }

    const target = await User.findById(req.params.id).select("-password");
    if (!target) throw notFound("User not found");
    if (target.role === "super_admin") {
      throw badRequest("Cannot impersonate another super-admin");
    }

    const token = generateImpersonationToken(
      String(target._id),
      target.role,
      String(req.user!._id),
    );
    attachImpersonationCookie(res, token);

    // No activity log — View as is silent (not shown on any dashboard).

    const home = roleHomePath(target.role);

    res.json({
      success: true,
      message: `Now acting as ${target.name}`,
      data: {
        mode: "act_as",
        user: target,
        target: {
          _id: target._id,
          name: target.name,
          email: target.email,
          role: target.role,
          avatar: target.avatar,
        },
        actor: {
          _id: req.user!._id,
          name: req.user!.name,
          email: req.user!.email,
          role: req.user!.role,
        },
        home,
        watermark: `ACTING AS ${target.role.toUpperCase()}`,
        impersonation: {
          active: true,
          mode: "act_as",
          actor: {
            _id: req.user!._id,
            name: req.user!.name,
            email: req.user!.email,
            role: req.user!.role,
          },
        },
      },
    });
  },
);

export const getCapabilities = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    res.json({
      success: true,
      data: {
        capabilities: ALL_SUPER_ADMIN_CAPABILITIES,
        mine: req.user!.capabilities?.length
          ? req.user!.capabilities
          : ALL_SUPER_ADMIN_CAPABILITIES,
      },
    });
  },
);
