import { Server as SocketServer } from "socket.io";
import type { AuthSocket } from "../types/socket.types.js";
import LiveClass from "../models/live-class.model.js";
import LiveSession from "../models/live-session.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";

const canAccessSession = async (
  userId: string,
  role: string,
  sessionId: string,
): Promise<boolean> => {
  if (role === "admin") return true;

  const session = await LiveSession.findById(sessionId).select("classId");
  if (!session) return false;

  const liveClass = await LiveClass.findById(session.classId).select(
    "tutor category",
  );
  if (!liveClass) return false;

  if (role === "tutor" && liveClass.tutor.toString() === userId) return true;

  if (role === "student") {
    const user = await User.findById(userId).select("categories");
    if (
      user?.categories?.some(
        (c) => c.toString() === liveClass.category.toString(),
      )
    ) {
      return true;
    }
  }

  if (role === "mentor") {
    const cat = await Category.findOne({
      _id: liveClass.category,
      mentors: userId,
    });
    if (cat) return true;
  }

  return false;
};

const isSessionHost = async (
  userId: string,
  role: string,
  sessionId: string,
): Promise<boolean> => {
  if (role === "admin") return true;
  const session = await LiveSession.findById(sessionId).select("classId");
  if (!session) return false;
  const liveClass = await LiveClass.findById(session.classId).select("tutor");
  return liveClass?.tutor.toString() === userId;
};

export const handleClassEvents = (
  io: SocketServer,
  socket: AuthSocket,
): void => {
  socket.on("join-class", async (payload: { sessionId: string }) => {
    try {
      const { sessionId } = payload ?? {};
      if (!sessionId || !socket.userId || !socket.userRole) return;

      const allowed = await canAccessSession(
        socket.userId,
        socket.userRole,
        sessionId,
      );
      if (!allowed) {
        socket.emit("error", { message: "Not authorized for this session" });
        return;
      }

      socket.join(`class:${sessionId}`);
      socket.to(`class:${sessionId}`).emit("user-joined", {
        socketId: socket.id,
        userId: socket.userId,
      });
    } catch (err) {
      console.error("join-class error:", err);
    }
  });

  socket.on("leave-class", (payload: { sessionId: string }) => {
    const { sessionId } = payload ?? {};
    if (!sessionId) return;
    socket.leave(`class:${sessionId}`);
    socket.to(`class:${sessionId}`).emit("user-left", {
      socketId: socket.id,
      userId: socket.userId,
    });
  });

  socket.on("class-ended", async (payload: { sessionId: string }) => {
    const { sessionId } = payload ?? {};
    if (!sessionId || !socket.userId || !socket.userRole) return;

    const isHost = await isSessionHost(
      socket.userId,
      socket.userRole,
      sessionId,
    );
    if (!isHost) return;

    io.to(`class:${sessionId}`).emit("class-ended", {
      sessionId,
      endedBy: socket.userId,
    });
  });

  socket.on(
    "raise-hand",
    (payload: { sessionId: string; raised: boolean }) => {
      const { sessionId, raised } = payload ?? {};
      if (!sessionId || !socket.userId) return;
      socket.to(`class:${sessionId}`).emit("hand-raised", {
        userId: socket.userId,
        userName: (socket as any).userName || "Participant",
        raised: !!raised,
      });
    },
  );

  const forwardToRoom = (
    sessionId: string,
    targetSocketId: string,
    event: string,
    data: Record<string, unknown>,
  ): void => {
    const room = io.sockets.adapter.rooms.get(`class:${sessionId}`);
    if (!room || !room.has(targetSocketId)) return;
    io.to(targetSocketId).emit(event, { from: socket.id, ...data });
  };

  socket.on(
    "offer",
    (payload: { sessionId: string; to: string; offer: unknown }) => {
      if (!payload?.sessionId || !payload?.to) return;
      forwardToRoom(payload.sessionId, payload.to, "offer", {
        offer: payload.offer,
      });
    },
  );

  socket.on(
    "answer",
    (payload: { sessionId: string; to: string; answer: unknown }) => {
      if (!payload?.sessionId || !payload?.to) return;
      forwardToRoom(payload.sessionId, payload.to, "answer", {
        answer: payload.answer,
      });
    },
  );

  socket.on(
    "ice-candidate",
    (payload: { sessionId: string; to: string; candidate: unknown }) => {
      if (!payload?.sessionId || !payload?.to) return;
      forwardToRoom(payload.sessionId, payload.to, "ice-candidate", {
        candidate: payload.candidate,
      });
    },
  );

  socket.on("start-screen-share", (payload: { sessionId: string }) => {
    if (!payload?.sessionId) return;
    socket.to(`class:${payload.sessionId}`).emit("screen-share-started", {
      socketId: socket.id,
    });
  });

  socket.on("stop-screen-share", (payload: { sessionId: string }) => {
    if (!payload?.sessionId) return;
    socket.to(`class:${payload.sessionId}`).emit("screen-share-stopped", {
      socketId: socket.id,
    });
  });

  socket.on(
    "mute-participant",
    async (payload: { sessionId: string; targetSocketId: string }) => {
      if (!payload?.sessionId || !payload?.targetSocketId) return;
      if (!socket.userId || !socket.userRole) return;

      const isHost = await isSessionHost(
        socket.userId,
        socket.userRole,
        payload.sessionId,
      );
      if (!isHost) {
        socket.emit("error", {
          message: "Only the host can mute participants",
        });
        return;
      }
      io.to(payload.targetSocketId).emit("you-were-muted");
    },
  );

  socket.on(
    "remove-participant",
    async (payload: { sessionId: string; targetSocketId: string }) => {
      if (!payload?.sessionId || !payload?.targetSocketId) return;
      if (!socket.userId || !socket.userRole) return;

      const isHost = await isSessionHost(
        socket.userId,
        socket.userRole,
        payload.sessionId,
      );
      if (!isHost) {
        socket.emit("error", {
          message: "Only the host can remove participants",
        });
        return;
      }
      io.to(payload.targetSocketId).emit("you-were-removed");
    },
  );
};
