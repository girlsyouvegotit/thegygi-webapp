import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestLog = new Map<string, RateLimitEntry>();
let nextLimiterId = 0;

const CLEANUP_INTERVAL = 5 * 60 * 1000;
const MAX_ENTRIES = 10000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestLog.entries()) {
    if (entry.resetAt < now) requestLog.delete(key);
  }
}, CLEANUP_INTERVAL);

cleanupTimer.unref();

export const rateLimit = (
  windowMs: number = env.rateLimit.windowMs,
  maxRequests: number = env.rateLimit.maxRequests,
  scopeByRoute: boolean = false,
  getClientKey: (req: Request) => string = (req) =>
    req.ip || req.socket.remoteAddress || "unknown",
) => {
  const limiterId = nextLimiterId++;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = getClientKey(req);
    const routeKey = scopeByRoute ? `${req.baseUrl}${req.path}` : "all";
    const key = `${limiterId}:${routeKey}:${clientKey}`;
    const now = Date.now();

    let entry = requestLog.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      requestLog.set(key, entry);
    }
    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    const reset = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", reset.toString());

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
        retryAfter: reset,
      });
      return;
    }

    if (requestLog.size > MAX_ENTRIES) {
      for (const [k, e] of requestLog.entries()) {
        if (e.resetAt < now) requestLog.delete(k);
      }
    }

    next();
  };
};

export const authRateLimit = rateLimit(15 * 60 * 1000, 10, true, (req) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "anonymous";
  return `${ip}:${email}`;
});

export const apiRateLimit = rateLimit(
  env.rateLimit.windowMs,
  env.rateLimit.maxRequests,
);
export const aiRateLimit = rateLimit(60 * 60 * 1000, 20);
export const uploadRateLimit = rateLimit(60 * 60 * 1000, 50);
