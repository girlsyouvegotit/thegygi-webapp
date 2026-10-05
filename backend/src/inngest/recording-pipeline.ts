import { inngest } from "./client.js";
import { NonRetriableError, RetryAfterError } from "inngest";
import Recording from "../models/recording.model.js";
import LiveClass from "../models/live-class.model.js";
import { transcribeAudio } from "../services/transcription.service.js";
import {
  generateClassSummary,
  generateChapters,
  generateAINotes,
  generatePracticeQuestions,
} from "../services/ai.service.js";
import { notifyRecordingAvailable } from "../services/notification.service.js";
import Category from "../models/category.model.js";

interface RecordingProcessEvent {
  recordingId: string;
  sessionId: string;
  classId: string;
}

export const processRecording = inngest.createFunction(
  {
    id: "process-recording",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const originalEvent = event.event;

      const data = event.data as RecordingProcessEvent;
      console.error(
        `Recording processing failed for ${data.recordingId}:`,
        error,
      );

      await Recording.findByIdAndUpdate(data.recordingId, {
        processingStatus: "failed",
        processingError: error.message ?? String(error),
        processingCompletedAt: new Date(),
      });
    },
  },
  { event: "recording/process" },
  async ({ event, step }) => {
    const { recordingId, sessionId, classId } =
      event.data as RecordingProcessEvent;

    console.log("Processing recording:", { recordingId, sessionId, classId });

    await step.run("update-status-processing", async () => {
      await Recording.findByIdAndUpdate(recordingId, {
        processingStatus: "processing",
        processingStartedAt: new Date(),
      });
    });

    const transcript = await step.run("transcribe-audio", async () => {
      const recording = await Recording.findById(recordingId);
      if (!recording) throw new NonRetriableError("Recording not found");
      if (!recording.storageUrl) {
        throw new NonRetriableError("Recording storage URL not found");
      }

      try {
        return await transcribeAudio(recording.storageUrl);
      } catch (error) {
        console.error("Transcription failed:", error);
        throw new RetryAfterError("Transcription service unavailable", "5m");
      }
    });

    const summary = await step.run("generate-summary", async () => {
      try {
        return await generateClassSummary(transcript);
      } catch (error) {
        console.error("Summary generation failed:", error);
        return "Summary generation failed. Please review the full transcript.";
      }
    });

    const chapters = await step.run("generate-chapters", async () => {
      try {
        return await generateChapters(transcript);
      } catch (error) {
        console.error("Chapter generation failed:", error);
        return [];
      }
    });

    const aiNotes = await step.run("generate-notes", async () => {
      try {
        return await generateAINotes(transcript, summary);
      } catch (error) {
        console.error("AI notes generation failed:", error);
        return "";
      }
    });

    const practiceQuestions = await step.run(
      "generate-practice-questions",
      async () => {
        try {
          return await generatePracticeQuestions(summary, aiNotes);
        } catch (error) {
          console.error("Practice questions generation failed:", error);
          return [];
        }
      },
    );

    await step.run("save-recording", async () => {
      const recording = await Recording.findByIdAndUpdate(
        recordingId,
        {
          transcript,
          summary,
          chapters,
          aiNotes,
          practiceQuestions,
          processingStatus: "ready",
          processingCompletedAt: new Date(),
        },
        { new: true },
      );

      await LiveClass.findByIdAndUpdate(classId, { status: "recorded" });

      if (recording) {
        const category = await Category.findById(recording.category).populate(
          "students",
        );

        if (category && category.students.length > 0) {
          const liveClass = await LiveClass.findById(classId);
          await notifyRecordingAvailable(
            category.students.map((s: any) => s._id.toString()),
            recordingId,
            liveClass?.title || "Class",
          );
        }
      }

      return { success: true };
    });

    return {
      message: "Recording processed successfully",
      recordingId,
      transcriptLength: typeof transcript === "string" ? transcript.length : 0,
    };
  },
);
