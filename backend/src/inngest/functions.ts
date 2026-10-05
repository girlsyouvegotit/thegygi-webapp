import { inngest } from "./client.js";
import { processRecording } from "./recording-pipeline.js";
import { calculateAttendance } from "./attendance-calculation.js";
import { autoAssignMentor } from "./mentor-assignment.js";
import { notifyClassScheduled } from "./class-notification.js";
import { generateAIQuiz } from "./ai-processing.js";

// Export all functions
export {
  inngest,
  processRecording,
  calculateAttendance,
  autoAssignMentor,
  notifyClassScheduled,
  generateAIQuiz,
};
