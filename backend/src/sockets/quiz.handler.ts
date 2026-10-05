import { Server as SocketServer } from "socket.io";
import type { AuthSocket } from "../types/socket.types.js";
import LiveSession from "../models/live-session.model.js";
import LiveClass from "../models/live-class.model.js";

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

export const handleQuizEvents = (
  io: SocketServer,
  socket: AuthSocket,
): void => {
  socket.on(
    "launch-quiz",
    async (payload: { sessionId: string; quizId: string }) => {
      if (!socket.userId || !socket.userRole) return;
      const { sessionId, quizId } = payload ?? {};
      if (!sessionId || !quizId) return;

      if (!(await isSessionHost(socket.userId, socket.userRole, sessionId))) {
        socket.emit("error", { message: "Only the host can launch a quiz" });
        return;
      }

      const timestamp = new Date();
      LiveSession.findByIdAndUpdate(sessionId, {
        $push: {
          chatMessages: {
            $each: [
              {
                userId: socket.userId,
                userName: "Host",
                message: "Launched a live quiz",
                timestamp,
                type: "quiz" as const,
                metadata: { quizId },
              },
            ],
            $slice: -500,
          },
          launchedQuizzes: quizId,
        },
      }).catch((error) => {
        console.error("Failed to persist quiz launch:", error);
      });

      io.to(`class:${sessionId}`).emit("quiz-launched", {
        quizId,
        launchedBy: socket.userId,
        timestamp,
      });
    },
  );

    socket.on(
      "submit-quiz-answer",
      (payload: {
        sessionId: string;
        quizId: string;
        questionId: string;
        answer: string | string[];
      }) => {
        const { sessionId, quizId, questionId, answer } = payload ?? {};
        if (!sessionId || !quizId || !questionId || !socket.userId) return;

        // Broadcast the answer to the tutor (host) only — students shouldn't
        // see each other's answers in real time.
        io.to(`class:${sessionId}`).emit("quiz-answer-submitted", {
          quizId,
          questionId,
          answer,
          userId: socket.userId,
        });
      },
    );

  socket.on(
    "launch-poll",
    async (payload: {
      sessionId: string;
      pollId: string;
      question: string;
      options: string[];
    }) => {
      if (!socket.userId || !socket.userRole) return;
      const { sessionId, pollId, question, options } = payload ?? {};
      if (!sessionId || !pollId || !question || !options?.length) return;

      if (!(await isSessionHost(socket.userId, socket.userRole, sessionId))) {
        socket.emit("error", { message: "Only the host can launch a poll" });
        return;
      }

      const timestamp = new Date();
      LiveSession.findByIdAndUpdate(sessionId, {
        $push: {
          chatMessages: {
            $each: [
              {
                userId: socket.userId,
                userName: "Host",
                message: question,
                timestamp,
                type: "poll" as const,
                metadata: { pollId, options },
              },
            ],
            $slice: -500,
          },
          launchedPolls: pollId,
        },
      }).catch((error) => {
        console.error("Failed to persist poll launch:", error);
      });

      io.to(`class:${sessionId}`).emit("poll-launched", {
        pollId,
        question,
        options,
        timestamp,
      });
    },
  );

  socket.on(
    "respond-poll",
    (payload: { sessionId: string; pollId: string; optionIndex: number }) => {
      const { sessionId, pollId, optionIndex } = payload ?? {};
      if (!sessionId || !pollId || typeof optionIndex !== "number") return;

      io.to(`class:${sessionId}`).emit("poll-response", {
        pollId,
        optionIndex,
        userId: socket.userId,
      });
    },
  );
};
