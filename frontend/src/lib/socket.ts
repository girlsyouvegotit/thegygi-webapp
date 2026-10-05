import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Initialize socket connection
 */
export const initializeSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a class room
 */
export const joinClassRoom = (sessionId: string): void => {
  socket?.emit("join-class", { sessionId });
};

/**
 * Leave a class room
 */
export const leaveClassRoom = (sessionId: string): void => {
  socket?.emit("leave-class", { sessionId });
};

/**
 * Send chat message
 */
export const sendChatMessage = (
  sessionId: string,
  message: string,
  userName: string,
): void => {
  socket?.emit("send-chat", { sessionId, message, userName });
};

/**
 * Join a community room
 */
export const joinCommunityRoom = (categoryId: string): void => {
  socket?.emit("join-community", { categoryId });
};

/**
 * Leave a community room
 */
export const leaveCommunityRoom = (categoryId: string): void => {
  socket?.emit("leave-community", { categoryId });
};

/**
 * Send community message
 */
export const sendCommunityMessage = (
  categoryId: string,
  channelId: string,
  content: string,
  userName: string,
): void => {
  socket?.emit("send-community-message", {
    categoryId,
    channelId,
    content,
    userName,
  });
};
