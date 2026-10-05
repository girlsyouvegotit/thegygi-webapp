import { inngest } from "./client.js";
import { assignMentorToStudent } from "../services/mentor-assignment.service.js";
import { NonRetriableError } from "inngest";

interface MentorAutoAssignmentEvent {
  studentId: string;
  categoryId: string;
}

export const autoAssignMentor = inngest.createFunction(
  {
    id: "auto-assign-mentor",
    retries: 2,
  },
  { event: "mentorship/auto-assign" },
  async ({ event, step }) => {
    const { studentId, categoryId } = event.data as MentorAutoAssignmentEvent;

    if (!studentId || !categoryId) {
      throw new NonRetriableError(
        "Missing required fields: studentId and categoryId",
      );
    }

    console.log("Auto-assigning mentor:", { studentId, categoryId });

    const assignment = await step.run("assign-mentor", async () => {
      try {
        return await assignMentorToStudent(studentId, categoryId);
      } catch (error) {
        console.error("Mentor assignment failed:", error);
        throw error;
      }
    });

    if (!assignment) {
      console.log("No available mentor found for student:", studentId);
    }

    return {
      message: assignment ? "Mentor assigned" : "No available mentor",
      assignment,
    };
  },
);
