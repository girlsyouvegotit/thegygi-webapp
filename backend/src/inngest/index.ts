import { serve } from "inngest/express";
import { inngest } from "./client.js";
import { processRecording } from "./recording-pipeline.js";
import { calculateAttendance } from "./attendance-calculation.js";
import { autoAssignMentor } from "./mentor-assignment.js";
import { notifyClassScheduled } from "./class-notification.js";
import { generateAIQuiz } from "./ai-processing.js";

export {
  inngest,
  processRecording,
  calculateAttendance,
  autoAssignMentor,
  notifyClassScheduled,
  generateAIQuiz,
};

export const inngestFunctions = [
  processRecording,
  calculateAttendance,
  autoAssignMentor,
  notifyClassScheduled,
  generateAIQuiz,
];

export const serveInngest = serve({
  client: inngest,
  functions: inngestFunctions,
});

export const getFunctionIds = (): string[] =>
  inngestFunctions.map((fn) => (fn as any).opts?.id ?? (fn as any).id ?? "");
