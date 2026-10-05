import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { env } from "../config/env.js";
import { z } from "zod";
import { serviceError } from "../middleware/error.middleware.js";

/**
 * Initialize Google Generative AI
 */
const getModel = () => {
  if (!env.googleAIKey) {
    throw serviceError("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }

  const google = createGoogleGenerativeAI({ apiKey: env.googleAIKey });
  return google("gemini-1.5-flash");
};

/**
 * Clean and parse JSON from AI response
 */
const parseJSONResponse = (text: string): any => {
  try {
    // Remove markdown code blocks if present
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", error);
    throw serviceError("Failed to parse AI response");
  }
};

/**
 * Generate quiz questions using AI
 */
export const generateQuizQuestions = async (
  subjectName: string,
  topic: string,
  difficulty: string,
  count: number,
): Promise<any[]> => {
  const model = getModel();

  const prompt = `
    You are a strict teacher. Create a JSON array of ${count} multiple-choice questions for a high school exam.

    CONTEXT:
    - Subject: ${subjectName}
    - Topic: ${topic}
    - Difficulty: ${difficulty}

    STRICT JSON SCHEMA (Array of Objects):
    [
      {
        "questionText": "Question string",
        "type": "MCQ",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The exact string of the correct option",
        "points": 1,
        "explanation": "Brief explanation of the correct answer",
        "difficulty": "${difficulty}"
      }
    ]

    RULES:
    1. Output ONLY raw JSON. No Markdown.
    2. Ensure correct answer matches one of the options exactly.
    3. Include an explanation for each question.
    4. Make sure options are distinct and plausible.
    5. Questions should test understanding, not just memorization.
  `;

  try {
    const { text } = await generateText({ prompt, model });
    const questions = parseJSONResponse(text);

    // Validate and normalize questions
    return questions.map((q: any, index: number) => ({
      ...q,
      type: q.type || "MCQ",
      points: q.points || 1,
      difficulty: q.difficulty || difficulty,
    }));
  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw serviceError("Failed to generate quiz questions");
  }
};

/**
 * Generate class summary from transcript
 */
export const generateClassSummary = async (
  transcript: string,
): Promise<string> => {
  const model = getModel();

  const prompt = `
    You are an educational assistant. Summarize the following class transcript.
    Focus on key concepts, main topics covered, and important takeaways.
    Keep the summary concise and well-structured.

    TRANSCRIPT:
    ${transcript.slice(0, 15000)}
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return text;
  } catch (error) {
    console.error("Summary generation failed:", error);
    return "Summary generation failed. Please review the full transcript.";
  }
};

/**
 * Generate chapters from transcript
 */
export const generateChapters = async (transcript: string): Promise<any[]> => {
  const model = getModel();

  const prompt = `
    You are an educational assistant. Analyze the following class transcript and generate chapters.
    Each chapter should have a timestamp (HH:MM:SS format), a title, and estimated duration in seconds.

    STRICT JSON SCHEMA:
    [
      {
        "timestamp": "00:00:00",
        "title": "Introduction",
        "duration": 300,
        "summary": "Brief description of this chapter"
      }
    ]

    TRANSCRIPT:
    ${transcript.slice(0, 15000)}
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return parseJSONResponse(text);
  } catch (error) {
    console.error("Chapter generation failed:", error);
    return [];
  }
};

/**
 * Generate AI notes from transcript
 */
export const generateAINotes = async (
  transcript: string,
  summary: string,
): Promise<string> => {
  const model = getModel();

  const prompt = `
    You are an educational assistant. Create comprehensive study notes from the following class content.
    Include:
    1. Key definitions
    2. Important concepts
    3. Formulas or rules (if applicable)
    4. Examples mentioned
    5. Common mistakes to avoid

    Format the notes using Markdown with clear sections.

    SUMMARY:
    ${summary}

    TRANSCRIPT:
    ${transcript.slice(0, 15000)}
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return text;
  } catch (error) {
    console.error("AI notes generation failed:", error);
    return "";
  }
};

/**
 * Generate practice questions from class content
 */
export const generatePracticeQuestions = async (
  summary: string,
  notes: string,
): Promise<any[]> => {
  const model = getModel();

  const prompt = `
    You are an educational assistant. Generate 5 practice questions based on the following class content.
    Questions should vary in difficulty and test different aspects of understanding.

    STRICT JSON SCHEMA:
    [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Correct option",
        "explanation": "Detailed explanation of why this is correct",
        "difficulty": "easy|medium|hard"
      }
    ]

    SUMMARY:
    ${summary.slice(0, 5000)}

    NOTES:
    ${notes.slice(0, 5000)}
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return parseJSONResponse(text);
  } catch (error) {
    console.error("Practice questions generation failed:", error);
    return [];
  }
};

/**
 * Generate AI study assistant response
 */
export const generateStudyAssistantResponse = async (
  question: string,
  context: string,
): Promise<string> => {
  const model = getModel();

  const prompt = `
    You are an AI study assistant. Answer the student's question based on the provided context.
    If the answer is not in the context, say so and provide general guidance.
    Be encouraging and helpful.

    STUDENT QUESTION:
    ${question}

    CONTEXT:
    ${context.slice(0, 15000)}
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return text;
  } catch (error) {
    console.error("Study assistant response failed:", error);
    throw serviceError("Failed to generate response");
  }
};

/**
 * Generate visual/diagram description
 */
export const generateVisualDescription = async (
  prompt: string,
): Promise<string> => {
  const model = getModel();

  const aiPrompt = `
    Create a detailed description for generating a visual/diagram for the following concept.
    Include:
    1. Type of diagram (flowchart, mind map, graph, etc.)
    2. Key elements and their relationships
    3. Labels and annotations
    4. Color scheme suggestions
    5. Layout recommendations

    CONCEPT: ${prompt}
  `;

  try {
    const { text } = await generateText({ prompt: aiPrompt, model });
    return text;
  } catch (error) {
    console.error("Visual description generation failed:", error);
    throw serviceError("Failed to generate visual description");
  }
};

/**
 * Generate feedback for student work
 */
export const generateFeedback = async (
  workType: string,
  workContent: string,
  criteria: string[],
): Promise<string> => {
  const model = getModel();

  const prompt = `
    You are an experienced educator. Provide constructive feedback on the following student work.
    Be specific, encouraging, and actionable.

    WORK TYPE: ${workType}
    EVALUATION CRITERIA: ${criteria.join(", ")}

    STUDENT WORK:
    ${workContent.slice(0, 15000)}

    Provide feedback in the following format:
    1. Overall assessment
    2. Strengths
    3. Areas for improvement
    4. Specific suggestions
  `;

  try {
    const { text } = await generateText({ prompt, model });
    return text;
  } catch (error) {
    console.error("Feedback generation failed:", error);
    throw serviceError("Failed to generate feedback");
  }
};
