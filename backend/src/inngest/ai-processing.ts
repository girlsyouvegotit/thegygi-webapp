import { inngest } from "./client.js";
import { generateQuizQuestions } from "../services/ai.service.js";
import Quiz from "../models/quiz.model.js";
import { NonRetriableError } from "inngest";

interface AIQuizGenerationEvent {
  quizId: string;
  subjectName: string;
  topic: string;
  difficulty: string;
  count: number;
}

export const generateAIQuiz = inngest.createFunction(
  { id: "generate-ai-quiz", retries: 2 },
  { event: "quiz/generate" },
  async ({ event, step }) => {
    const { quizId, subjectName, topic, difficulty, count } =
      event.data as AIQuizGenerationEvent;

    if (!quizId || !subjectName || !topic) {
      throw new NonRetriableError("Missing required fields");
    }

    let questions: any[];
    try {
      questions = await step.run("generate-questions", async () =>
        generateQuizQuestions(subjectName, topic, difficulty, count),
      );
    } catch (error) {
      // Deterministic failure — retrying hits the same wall.
      throw new NonRetriableError(
        `Question generation failed: ${(error as Error).message}`,
      );
    }

    if (!questions || questions.length === 0) {
      throw new NonRetriableError("No questions generated");
    }

    await step.run("save-quiz", async () => {
      const quiz = await Quiz.findByIdAndUpdate(
        quizId,
        {
          questions,
          isActive: false,
          questionCount: questions.length,
          totalPoints: questions.reduce(
            (sum: number, q: any) => sum + (q.points || 1),
            0,
          ),
        },
        { new: true },
      );

      if (!quiz) throw new NonRetriableError("Quiz not found");

      return {
        success: true,
        questionCount: questions.length,
        quizTitle: quiz.title,
      };
    });

    return {
      message: "Quiz generated",
      questionCount: questions.length,
    };
  },
);
