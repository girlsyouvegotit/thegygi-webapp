import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model.js";
import type { IUser } from "../models/user.model.js";
import {
  extractTokenFromRequest,
  verifyToken,
  type JwtPayload,
} from "../utils/jwt.util.js";
import { unauthorized } from "./error.middleware.js";

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  token?: string;
  /** Present when a super-admin is acting as `user`. */
  impersonator?: IUser;
  impersonatorId?: string;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) throw unauthorized("Not authorized, no token provided");

    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "Token expired") throw unauthorized("Token expired");
      throw unauthorized("Invalid token");
    }

    if (decoded.type !== "access") throw unauthorized("Invalid token type");
    if (!decoded.userId) throw unauthorized("Invalid token payload");

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw unauthorized("User not found");
    if (!user.isActive) throw unauthorized("Account is suspended");

    if (
      user.sessionsRevokedAt &&
      decoded.iat &&
      decoded.iat * 1000 < user.sessionsRevokedAt.getTime()
    ) {
      throw unauthorized("Session revoked");
    }

    if (decoded.impersonatorId) {
      const actor = await User.findById(decoded.impersonatorId).select(
        "-password",
      );
      if (
        !actor ||
        !actor.isActive ||
        actor.role !== "super_admin"
      ) {
        throw unauthorized("Impersonation session is no longer valid");
      }
      req.impersonator = actor;
      req.impersonatorId = actor._id.toString();
    }

    req.user = user;
    req.userId = user._id.toString();
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);
    if (token) {
      try {
        const decoded = await verifyToken(token);
        if (decoded.type === "access" && decoded.userId) {
          const user = await User.findById(decoded.userId).select("-password");
          if (user && user.isActive) {
            req.user = user;
            req.userId = user._id.toString();
            req.token = token;
          }
        }
      } catch {
        /* optional auth — ignore bad tokens */
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
