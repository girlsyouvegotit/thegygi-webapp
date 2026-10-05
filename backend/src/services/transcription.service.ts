import { env } from "../config/env.js";

/**
 * Transcription service interface
 * This is a placeholder for actual transcription integration (e.g., Whisper API)
 */

/**
 * Transcribe audio/video file to text
 */
export const transcribeAudio = async (filePath: string): Promise<string> => {
  // TODO: Integrate with actual transcription service (Whisper API, Google Speech-to-Text, etc.)
  // For now, return empty string (will be populated by actual service)
  console.log(`Transcribing file: ${filePath}`);

  // Placeholder implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Transcription will be available after processing.");
    }, 1000);
  });
};

/**
 * Check if transcription service is available
 */
export const isTranscriptionAvailable = (): boolean => {
  // Check if API keys are configured
  return !!process.env.OPENAI_API_KEY || !!process.env.GOOGLE_SPEECH_API_KEY;
};

/**
 * Get transcription status
 */
export const getTranscriptionStatus = async (
  recordingId: string,
): Promise<string> => {
  // Placeholder
  return "pending";
};
