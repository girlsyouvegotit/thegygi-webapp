import { Server as SocketServer } from "socket.io";
import type { AuthSocket } from "../types/socket.types.js";

export const handleNotificationEvents = (
  _io: SocketServer,
  socket: AuthSocket,
): void => {
  socket.on("join-notifications", () => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
  });

  socket.on("leave-notifications", () => {
    if (socket.userId) socket.leave(`user:${socket.userId}`);
  });

  socket.on("mark-notification-read", (payload: { notificationId: string }) => {
    if (!payload?.notificationId) return;
    socket.emit("notification-marked-read", {
      notificationId: payload.notificationId,
    });
  });
};

export const sendNotificationToUser = (
  io: SocketServer,
  userId: string,
  notification: any,
): void => {
  io.to(`user:${userId}`).emit("new-notification", notification);
};
