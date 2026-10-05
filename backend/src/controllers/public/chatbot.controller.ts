import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import {
  answerGygiChatQuestion,
  type ChatbotTurn,
} from "../../services/chatbot.service.js";

/**
 * Public GYGI FAQ chat bot
 * @route POST /api/public/chatbot
 */
export const askPublicChatbot = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { message, history } = req.body as {
      message: string;
      history?: ChatbotTurn[];
    };

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (turn) =>
              turn &&
              (turn.role === "user" || turn.role === "assistant") &&
              typeof turn.content === "string",
          )
          .slice(-10)
          .map((turn) => ({
            role: turn.role,
            content: turn.content.trim().slice(0, 1000),
          }))
      : [];

    const { reply, source } = await answerGygiChatQuestion(
      message,
      safeHistory,
    );

    res.status(200).json({
      success: true,
      data: {
        reply,
        source,
      },
    });
  },
);
