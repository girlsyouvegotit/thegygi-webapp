import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
  asyncHandler,
  unauthorized,
} from "../middleware/error.middleware.js";
import * as svc from "../services/official-message.service.js";

export const listThreads = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw unauthorized();
    const items = await svc.listMyThreads(
      String(req.user._id),
      req.user.role,
    );
    res.json({ success: true, data: { items } });
  },
);

export const getThread = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw unauthorized();
    const thread = await svc.getThreadForUser(
      String(req.params.id),
      String(req.user._id),
      req.user.role,
    );
    res.json({ success: true, data: { thread } });
  },
);

export const resolveThread = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw unauthorized();
    const thread = await svc.resolveThread(
      {
        threadId: req.query.threadId
          ? String(req.query.threadId)
          : undefined,
        actionId: req.query.actionId
          ? String(req.query.actionId)
          : undefined,
      },
      String(req.user._id),
      req.user.role,
    );
    res.json({ success: true, data: { thread } });
  },
);

export const postReply = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw unauthorized();
    const thread = await svc.replyToThread(
      String(req.params.id),
      String(req.user._id),
      String(req.body.message || ""),
      req.user.role,
    );
    res.json({ success: true, data: { thread } });
  },
);
