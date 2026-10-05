import { Server as SocketServer } from "socket.io";
import type { AuthSocket } from "../types/socket.types.js";
import LiveSession from "../models/live-session.model.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CHAT_HISTORY = 500;

export const handleChatEvents = (
  io: SocketServer,
  socket: AuthSocket,
): void => {
  socket.on(
    "send-chat",
    async (
      payload: { sessionId: string; message: string; userName?: string },
      callback?: (response: any) => void,
    ) => {
      try {
        const { sessionId, message, userName } = payload ?? {};

        if (!sessionId || !message || message.trim().length === 0) {
          return callback?.({ success: false, error: "Message is required" });
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          return callback?.({
            success: false,
            error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters`,
          });
        }
        if (!socket.rooms.has(`class:${sessionId}`)) {
          return callback?.({
            success: false,
            error: "Not in this class session",
          });
        }

        const timestamp = new Date();
        const messageData = {
          userId: socket.userId,
          userName: userName || "User",
          message: message.trim(),
          timestamp,
          type: "text" as const,
        };

        LiveSession.findByIdAndUpdate(
          sessionId,
          {
            $push: {
              chatMessages: {
                $each: [messageData],
                $slice: -MAX_CHAT_HISTORY,
              },
            },
          },
          { new: false },
        ).catch((error) => {
          console.error("Failed to save chat message:", error);
        });

        io.to(`class:${sessionId}`).emit("new-message", messageData);
        callback?.({ success: true, timestamp });
      } catch (error) {
        console.error("Chat message error:", error);
        callback?.({ success: false, error: "Failed to send message" });
      }
    },
  );

  socket.on(
    "get-chat-history",
    async (
      payload: { sessionId: string; limit?: number },
      callback?: (response: any) => void,
    ) => {
      try {
        const { sessionId, limit = 50 } = payload ?? {};

        if (!socket.rooms.has(`class:${sessionId}`)) {
          return callback?.({
            success: false,
            error: "Not in this class session",
          });
        }

        const session = await LiveSession.findById(sessionId)
          .select("chatMessages")
          .slice("chatMessages", -limit);

        if (session) {
          // Emit as event so the frontend's socket.on("chat-history") fires
          socket.emit("chat-history", session.chatMessages);
          callback?.({
            success: true,
            messages: session.chatMessages,
          });
        } else {
          callback?.({ success: false, error: "Session not found" });
        }
      } catch (error) {
        console.error("Get chat history error:", error);
        callback?.({ success: false, error: "Failed to get chat history" });
      }
    },
  );

  socket.on(
    "typing",
    (payload: { sessionId: string; userName: string; isTyping: boolean }) => {
      const { sessionId, userName, isTyping } = payload ?? {};
      if (!sessionId) return;
      socket.to(`class:${sessionId}`).emit("user-typing", {
        userId: socket.userId,
        userName,
        isTyping,
      });
    },
  );
};