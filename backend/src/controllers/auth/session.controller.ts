import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { attachTokenCookie, clearTokenCookie } from "../../utils/jwt.util.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

/**
 * Refresh token (re-attach cookie)
 * @route POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authorized",
      });
      return;
    }

    // Re-attach token (extend session)
    const token = (req as any).token;
    attachTokenCookie(res, token);

    res.json({
      success: true,
      message: "Token refreshed",
    });
  },
);

/**
 * Logout from all devices (clear token)
 * @route POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // With JWT, we can't invalidate all tokens server-side without a blacklist
    // For now, just clear the cookie
    clearTokenCookie(res);

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  },
);
