import { inngest } from "./client.js";
import { calculateAttendanceForSession } from "../services/attendance.service.js";
import LiveSession from "../models/live-session.model.js";
import { NonRetriableError } from "inngest";

interface AttendanceCalculationEvent {
  sessionId: string;
  classId: string;
}

export const calculateAttendance = inngest.createFunction(
  {
    id: "calculate-attendance",
    retries: 2,
  },
  { event: "attendance/calculate" },
  async ({ event, step }) => {
    const { sessionId, classId } = event.data as AttendanceCalculationEvent;

    console.log("Calculating attendance for session:", sessionId);

    await step.run("calculate-attendance", async () => {
      const session = await LiveSession.findById(sessionId);

      if (!session) {
        throw new NonRetriableError("Session not found");
      }

      if (session.status !== "ended") {
        console.warn("Session not ended yet, skipping attendance calculation");
        return { success: false, reason: "Session not ended" };
      }

      await calculateAttendanceForSession(sessionId);
      return {
        success: true,
        participantCount: session.participants.length,
      };
    });

    return {
      message: "Attendance calculated",
      sessionId,
    };
  },
);
