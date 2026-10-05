import type { Request } from "express";
import ActivityLog from "../models/activity-log.model.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export interface LogActivityInput {
  userId: string;
  action: string;
  details?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  isAudit?: boolean;
  req?: Request;
}

export const logActivity = async (input: LogActivityInput): Promise<void> => {
  try {
    const authReq = input.req as AuthRequest | undefined;

    // Silent View as: never write activity that would appear on user/admin dashboards.
    if (authReq?.impersonatorId || input.metadata?.silentImpersonation === true) {
      return;
    }

    await ActivityLog.create({
      user: input.userId,
      action: input.action,
      details: input.details,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      isAudit: input.isAudit ?? false,
      ipAddress: input.req?.ip ?? input.req?.socket?.remoteAddress,
      userAgent: input.req?.headers?.["user-agent"],
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
