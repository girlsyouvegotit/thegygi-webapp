import User from "../models/user.model.js";
import { generateToken } from "../utils/jwt.util.js";
import { sendEmail } from "./email.service.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import {
  badRequest,
  unauthorized,
  conflict,
} from "../middleware/error.middleware.js";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  categoryId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: IUser;
  token: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
  input: RegisterInput,
): Promise<AuthResult> => {
  const { name, email, password, categoryId } = input;
  const validCategoryId =
    categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? categoryId
      : undefined;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.moderationStatus === "banned") {
      throw conflict("This email cannot be used to register.");
    }
    throw conflict("User with this email already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: "student",
    isActive: true,
    categories: validCategoryId ? [validCategoryId] : [],
  });

  // Generate token
  const token = generateToken(user._id.toString(), user.role);

  return { user, token };
};

/**
 * Login user
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");

  // Find user with password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  // Check if account is locked
  if (user.isLocked && user.isLocked()) {
    throw unauthorized("Account is temporarily locked. Try again later.");
  }

  // Check if active / banned / suspended
  if (!user.isActive || user.moderationStatus === "banned") {
    if (user.moderationStatus === "banned") {
      throw unauthorized(
        user.banReason
          ? `Account is banned. Reason: ${user.banReason}`
          : "Account is banned. Contact support.",
      );
    }
    if (
      user.moderationStatus === "suspended" &&
      user.suspendUntil &&
      user.suspendUntil > new Date()
    ) {
      throw unauthorized(
        `Account is suspended until ${user.suspendUntil.toLocaleString()}. ${
          user.suspendReason ? `Reason: ${user.suspendReason}` : ""
        }`.trim(),
      );
    }
    // Auto-lift expired suspend
    if (
      user.moderationStatus === "suspended" &&
      user.suspendUntil &&
      user.suspendUntil <= new Date()
    ) {
      user.isActive = true;
      user.moderationStatus =
        (user.strikeCount || 0) > 0 ? "warned" : "clear";
      user.suspendUntil = null;
      user.suspendReason = null;
      await user.save();
    } else if (!user.isActive) {
      throw unauthorized("Account is suspended. Contact administrator.");
    }
  }

  // Check password (direct compare — avoid document save() re-hashing)
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const attempts = Math.min((user.failedLoginAttempts || 0) + 1, 10);
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: attempts,
          ...(attempts >= 5
            ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
            : {}),
        },
      },
    );
    throw unauthorized("Invalid email or password");
  }

  // Update login metadata without loading password onto a save() path
  // (prevents accidental double-hashing of an already-hashed password).
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
      },
      $unset: { lockedUntil: 1 },
    },
  );

  // Generate token
  const token = generateToken(user._id.toString(), user.role);

  // Remove password from user object
  user.password = undefined as any;

  return { user, token };
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = async (
  email: string,
): Promise<{ resetToken: string; user: IUser } | null> => {
  const user = await User.findOne({ email });
  if (!user) {
    return null;
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  return { resetToken, user };
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  password: string,
): Promise<boolean> => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw badRequest("Invalid or expired token");
  }

  // Check if new password is same as old
  const isSamePassword = await user.matchPassword(password);
  if (isSamePassword) {
    throw badRequest("New password cannot be the same as old password");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return true;
};

/**
 * Change password (for logged-in users)
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw unauthorized("User not found");
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw badRequest("Current password is incorrect");
  }

  // Check if new password is different
  const isSamePassword = await user.matchPassword(newPassword);
  if (isSamePassword) {
    throw badRequest("New password must be different from current password");
  }

  user.password = newPassword;
  await user.save();
};

/**
 * Verify email
 */
export const verifyEmail = async (token: string): Promise<boolean> => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  });

  if (!user) {
    throw badRequest("Invalid verification token");
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationToken = undefined;
  await user.save();

  return true;
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  user: IUser,
  clientUrl: string,
): Promise<void> => {
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;
  const message = `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
    <p>If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email",
    html: message,
  });
};
