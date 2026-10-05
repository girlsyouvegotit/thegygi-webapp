import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { getAllowedOrigins } from "../config/cors.js";
import {
  verifyToken,
  extractTokenFromCookieHeader,
} from "../utils/jwt.util.js";
import { handleClassEvents } from "./class.handler.js";
import { handleChatEvents } from "./chat.handler.js";
import { handleQuizEvents } from "./quiz.handler.js";
import { handleCommunityEvents } from "./community.handler.js";
import { handleNotificationEvents } from "./notification.handler.js";
import type { AuthSocket } from "../types/socket.types.js";
import {
  presenceTrack,
  presenceUntrack,
} from "../services/presence.store.js";

let io: SocketServer;

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ["websocket", "polling"],
    allowEIO3: false,
  });

  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) return next(new Error("Authentication required"));

      const decoded = await verifyToken(token);
      if (decoded.type !== "access") {
        return next(new Error("Invalid token type"));
      }
      if (!decoded.userId) return next(new Error("Invalid token payload"));

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.join(`user:${decoded.userId}`);
      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    console.log(`Socket connected: ${socket.id} (${socket.userId})`);

    if (socket.userId) {
      presenceTrack(socket.userId);
    }

    handleClassEvents(io, socket);
    handleChatEvents(io, socket);
    handleQuizEvents(io, socket);
    handleCommunityEvents(io, socket);
    handleNotificationEvents(io, socket);

    socket.on("ping-check", (callback) => {
      if (typeof callback === "function") {
        callback({ status: "ok", timestamp: Date.now() });
      }
    });

    socket.on("error", (error) => {
      console.error(`Socket error (${socket.id}):`, error);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.userId} (${reason})`);
      if (socket.userId) {
        // Only untrack if no other sockets remain for this user
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          (s) =>
            (s as AuthSocket).userId === socket.userId && s.id !== socket.id,
        );
        if (!stillConnected) {
          presenceUntrack(socket.userId);
        }
      }
      for (const room of Array.from(socket.rooms)) {
        if (room.startsWith("class:")) {
          socket.to(room).emit("user-left", {
            socketId: socket.id,
            userId: socket.userId,
            reason,
          });
        }
      }
    });
  });

  return io;
};

const extractSocketToken = (socket: AuthSocket): string | null => {
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;
  return extractTokenFromCookieHeader(socket.handshake.headers.cookie);
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const sendToUser = (userId: string, event: string, data: any): void => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

export const sendToClass = (
  sessionId: string,
  event: string,
  data: any,
): void => {
  if (io) io.to(`class:${sessionId}`).emit(event, data);
};

export const sendToCommunity = (
  categoryId: string,
  event: string,
  data: any,
): void => {
  if (io) io.to(`community:${categoryId}`).emit(event, data);
};
