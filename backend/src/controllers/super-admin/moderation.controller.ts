import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  unauthorized,
} from "../../middleware/error.middleware.js";
import * as svc from "../../services/moderation.service.js";

const requireSuper = (req: AuthRequest) => {
  if (!req.user || req.user.role !== "super_admin") {
    throw unauthorized("Super-admin access required");
  }
};

const actor = (req: AuthRequest) => ({
  actorId: String(req.user!._id),
  req,
});

export const getModerationOverview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getModerationOverview();
    res.json({ success: true, data });
  },
);

export const searchTargets = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const items = await svc.searchModerationTargets(String(req.query.q || ""));
    res.json({ success: true, data: { items } });
  },
);

export const getHistory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.getEnforcementHistory(String(req.params.id));
    res.json({ success: true, data });
  },
);

export const postMessage = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.sendOfficialMessage(
      String(req.params.id),
      req.body,
      actor(req),
    );
    res.json({ success: true, data });
  },
);

export const postWarn = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.warnUser(String(req.params.id), req.body, actor(req));
    res.json({ success: true, data });
  },
);

export const postSuspend = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.suspendUserModeration(
      String(req.params.id),
      req.body,
      actor(req),
    );
    res.json({ success: true, data });
  },
);

export const postUnsuspend = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.unsuspendUser(
      String(req.params.id),
      req.body || {},
      actor(req),
    );
    res.json({ success: true, data });
  },
);

export const postBan = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.banUser(String(req.params.id), req.body, actor(req));
    res.json({ success: true, data });
  },
);

export const postUnban = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    requireSuper(req);
    const data = await svc.unbanUser(String(req.params.id), req.body, actor(req));
    res.json({ success: true, data });
  },
);
