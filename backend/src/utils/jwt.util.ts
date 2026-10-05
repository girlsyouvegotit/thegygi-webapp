import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Response } from "express";
import type { userRoles } from "../models/user.model.js";

export interface JwtPayload {
  userId: string;
  role: userRoles;
  type: "access" | "refresh";
  /** Super-admin who started an act-as session (when present). */
  impersonatorId?: string;
  iat?: number;
  exp?: number;
}

const COOKIE_NAME = "jwt";
const REFRESH_COOKIE_NAME = "refreshToken";
const ACCESS_TOKEN_TTL = "7d";
const IMPERSONATION_TOKEN_TTL = "4h";
const REFRESH_TOKEN_TTL = "30d";
const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const IMPERSONATION_COOKIE_MAX_AGE = 4 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const ALGORITHM = "HS512" as const;
const ISSUER = "gygi-platform";
const AUDIENCE = "gygi-users";

const buildCookieOptions = (maxAge: number, path = "/") => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: (env.nodeEnv === "production" ? "none" : "lax") as "none" | "lax",
  maxAge,
  path,
});

export const generateAccessToken = (
  userId: string,
  role: userRoles,
  options?: { impersonatorId?: string; expiresIn?: SignOptions["expiresIn"] },
): string => {
  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn ?? ACCESS_TOKEN_TTL,
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(
    {
      userId,
      role,
      type: "access" as const,
      ...(options?.impersonatorId
        ? { impersonatorId: options.impersonatorId }
        : {}),
    },
    env.jwtSecret,
    signOptions,
  );
};

/** Short-lived act-as token bound to the originating super-admin. */
export const generateImpersonationToken = (
  targetUserId: string,
  targetRole: userRoles,
  impersonatorId: string,
): string =>
  generateAccessToken(targetUserId, targetRole, {
    impersonatorId,
    expiresIn: IMPERSONATION_TOKEN_TTL,
  });

export const generateRefreshToken = (userId: string, role: userRoles): string =>
  jwt.sign({ userId, role, type: "refresh" }, env.jwtSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
  });

export const generateToken = generateAccessToken;

export const verifyToken = (token: string): Promise<JwtPayload> =>
  new Promise((resolve, reject) => {
    jwt.verify(
      token,
      env.jwtSecret,
      { algorithms: [ALGORITHM], issuer: ISSUER, audience: AUDIENCE },
      (error, decoded) => {
        if (error) {
          if (error instanceof jwt.TokenExpiredError) {
            reject(new Error("Token expired"));
          } else if (error instanceof jwt.JsonWebTokenError) {
            reject(new Error("Invalid token"));
          } else {
            reject(error);
          }
          return;
        }
        resolve(decoded as JwtPayload);
      },
    );
  });

export const attachTokenCookie = (
  res: Response,
  token: string,
  maxAge = ACCESS_COOKIE_MAX_AGE,
): void => {
  res.cookie(COOKIE_NAME, token, buildCookieOptions(maxAge));
};

export const attachImpersonationCookie = (
  res: Response,
  token: string,
): void => {
  attachTokenCookie(res, token, IMPERSONATION_COOKIE_MAX_AGE);
};

export const attachRefreshTokenCookie = (
  res: Response,
  token: string,
): void => {
  res.cookie(
    REFRESH_COOKIE_NAME,
    token,
    buildCookieOptions(REFRESH_COOKIE_MAX_AGE, "/api/auth"),
  );
};

export const clearTokenCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAME, buildCookieOptions(0));
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, buildCookieOptions(0, "/api/auth"));
};

export const extractTokenFromCookieHeader = (
  cookieHeader: string | undefined,
): string | null => {
  if (!cookieHeader) return null;
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies[COOKIE_NAME] || null;
};

export const extractTokenFromRequest = (req: {
  headers?: Record<string, any>;
}): string | null => {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return extractTokenFromCookieHeader(req.headers?.cookie);
};
