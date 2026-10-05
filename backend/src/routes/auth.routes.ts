import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  stopImpersonation,
} from "../controllers/auth/auth.controller.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/auth/password.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  categoryId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
});

// Public routes
router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.post(
  "/forgot-password",
  authRateLimit,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password/:token",
  authRateLimit,
  validateBody(resetPasswordSchema),
  resetPassword,
);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);
router.post("/stop-impersonation", protect, stopImpersonation);

export default router;
