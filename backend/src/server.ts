import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import type { Server as HttpServer } from "http";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { getAllowedOrigins } from "./config/cors.js";
import { initializeSocket } from "./sockets/socket.server.js";
import { serveInngest } from "./inngest/index.js";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing/core.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import communityRoutes from "./routes/community.routes.js";
import classRoutes from "./routes/class.routes.js";
import recordingRoutes from "./routes/recording.routes.js";
import storageRoutes from "./routes/storage.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import mentorshipRoutes from "./routes/mentorship.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import userRoutes from "./routes/user.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import academicYearRoutes from "./routes/academic-year.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import publicRoutes from "./routes/public.routes.js";
import contentRoutes from "./routes/content.routes.js";
import certificateRoutes, {
  enrollmentRouter,
} from "./routes/certificate.routes.js";
import searchRoutes from "./routes/search.routes.js";
import superAdminRoutes from "./routes/super-admin.routes.js";
import officialMessageRoutes from "./routes/official-message.routes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import postProgramRoutes from "./routes/post-program.routes.js";

// Middleware imports
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { apiRateLimit } from "./middleware/rate-limit.middleware.js";
import { optionalAuth } from "./middleware/auth.middleware.js";

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer: HttpServer = createServer(app);
const PORT = env.port;

// Render / reverse proxies: needed for correct req.ip (rate limits) and
// req.protocol (playback HTTPS URLs behind TLS termination).
app.set("trust proxy", 1);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// ==================== CORS Configuration ====================
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        // Return false instead of throwing so the browser gets a clean
        // CORS rejection rather than a 500.
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // Reflect Access-Control-Request-Headers instead of a fixed list.
    // UploadThing (+ browser/devtools OpenTelemetry) may send headers like
    // x-uploadthing-* and traceparent; a static allow-list breaks uploads.
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  }),
);

// ==================== Body Parsing ====================
// NOTE: express.json() is applied globally. It skips requests whose
// Content-Type doesn't match application/json, so it does not interfere
// with the multipart uploads UploadThing sends to /api/uploadthing.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ==================== Security Headers ====================
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (env.nodeEnv === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
});

// ==================== Request Logging (Development Only) ====================
if (env.nodeEnv === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`,
      );
    });
    next();
  });
}

// ==================== Rate Limiting ====================
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  // Dashboards fire many parallel GETs; don't throttle local/dev traffic.
  if (env.nodeEnv === "development" || env.nodeEnv === "test") {
    next();
    return;
  }

  // Skip rate limiting for auth check, logout, health checks,
  // public marketing endpoints, category listing (needed for signup),
  // and UploadThing callbacks (they include their own auth signature and
  // run frequently during a single upload session).
  if (
    req.path === "/auth/me" ||
    req.path === "/auth/logout" ||
    req.path === "/health" ||
    req.path.startsWith("/uploadthing") ||
    req.path.startsWith("/public/") ||
    (req.method === "GET" &&
      (req.path === "/content/blog" ||
        req.path.startsWith("/content/blog/") ||
        req.path === "/content/about")) ||
    (req.method === "GET" && req.path === "/categories") ||
    // Large binary recording uploads are a single long request
    (req.method === "POST" && /\/classes\/[^/]+\/recording\/upload$/.test(req.path))
  ) {
    next();
    return;
  }

  apiRateLimit(req, res, next);
});

// ==================== Health Check ====================
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "GYGI Platform API",
    version: "3.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: env.nodeEnv,
    version: process.version,
  });
});

// ==================== API Routes ====================
const apiRoutes = [
  { path: "/auth", router: authRoutes },
  { path: "/categories", router: categoryRoutes },
  { path: "/communities", router: communityRoutes },
  { path: "/classes", router: classRoutes },
  { path: "/recordings", router: recordingRoutes },
  { path: "/storage", router: storageRoutes },
  { path: "/quizzes", router: quizRoutes },
  { path: "/assignments", router: assignmentRoutes },
  { path: "/mentorship", router: mentorshipRoutes },
  { path: "/attendance", router: attendanceRoutes },
  { path: "/analytics", router: analyticsRoutes },
  { path: "/users", router: userRoutes },
  { path: "/finance", router: financeRoutes },
  { path: "/academic-years", router: academicYearRoutes },
  { path: "/activities", router: activityRoutes },
  { path: "/settings", router: settingsRoutes },
  { path: "/notifications", router: notificationRoutes },
  { path: "/public", router: publicRoutes },
  { path: "/testimonials", router: testimonialRoutes },
  { path: "/post-program", router: postProgramRoutes },
  { path: "/content", router: contentRoutes },
  { path: "/certificates", router: certificateRoutes },
  { path: "/enrollments", router: enrollmentRouter },
  { path: "/search", router: searchRoutes },
  { path: "/super-admin", router: superAdminRoutes },
  { path: "/official-messages", router: officialMessageRoutes },
];

apiRoutes.forEach(({ path, router }) => {
  app.use(`/api${path}`, router);
});

// ==================== UploadThing Route ====================
// IMPORTANT: Do NOT use `protect` here.
// UploadThing's post-upload callback hits this same path from their
// servers (no user cookie). Auth for the *client* upload request is
// enforced inside uploadRouter middleware via optionalAuth + req.user.
app.use(
  "/api/uploadthing",
  optionalAuth,
  createRouteHandler({ router: uploadRouter }),
);

// ==================== Inngest Endpoint ====================
app.use("/api/inngest", serveInngest);

// ==================== Error Handling ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== Graceful Shutdown ====================
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log("HTTP server closed");
        resolve();
      });
    });

    io.close(() => {
      console.log("Socket.io closed");
    });

    await mongoose.disconnect();
    console.log("Database connection closed");

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// ==================== Start Server ====================
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`\n=================================`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Socket.io: Running`);
      console.log(`Client URL: ${env.clientUrl}`);
      console.log(`=================================\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export { app, io, httpServer };
