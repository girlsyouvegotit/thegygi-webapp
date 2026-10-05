import type { Request, Response } from "express";
import crypto from "crypto";
import User from "../../models/user.model.js";
import { sendEmail } from "../../services/email.service.js";
import { env } from "../../config/env.js";
import { logActivity } from "../../services/activity.service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const genericMessage =
      "If that email exists, a reset link has been sent.";

    const user = await User.findOne({ email });
    if (!user) {
      // Same body as success path — avoid email enumeration.
      res.status(200).json({
        success: true,
        message: genericMessage,
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email
    const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;
    const message = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes.</p>
    <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: genericMessage,
      });
    } catch (error) {
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      console.error("Email send error:", error);
      res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  },
);

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Invalidate existing JWTs so a stolen cookie cannot outlive the reset.
    user.sessionsRevokedAt = new Date();
    await user.save();

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      action: "Reset password",
      resourceType: "user",
      resourceId: user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  },
);
