import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { env } from "../config/env.js";
import {
  buildGygiHandbook,
  canonicalizeGygiQuestion,
  GYGI_CONTACT,
  GYGI_KNOWLEDGE_CHUNKS,
  type GygiKnowledgeChunk,
} from "../data/gygi-knowledge.js";
import Category from "../models/category.model.js";

export type ChatbotTurn = {
  role: "user" | "assistant";
  content: string;
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const GYGI_SIGNAL =
  /\b(gygi|girls you got it|mentor|mentorship|tutor|class|course|program|certificate|alumni|community|enroll|register|dashboard|assignment|quiz|recording|pad[- ]?a[- ]?girl|vocational|cyber|ui\/?ux|data science)\b/i;

const OFF_TOPIC_HARD =
  /\b(write (me )?a (poem|essay|code)|solve this math|stock tip|crypto|bitcoin|who will win|recipe for|horoscope)\b/i;

/** Short natural prompts people say to an assistant about the org itself. */
const isAboutGygiIntent = (question: string): boolean => {
  const q = normalize(question);
  if (!q) return false;

  if (
    /\b(what is|what's|whats|who is|who's|tell me about|explain|define|introduce|meaning of)\b/.test(
      q,
    ) &&
    /\bgygi\b/.test(q)
  ) {
    return true;
  }

  if (
    /^(what is this|who are you|what do you do|tell me about yourself|introduce yourself)\b/.test(
      q,
    )
  ) {
    return true;
  }

  // Bare org name / “about gygi”
  if (/^(gygi|about gygi|about you)\??$/.test(q)) return true;

  return false;
};

const scoreChunk = (question: string, chunk: GygiKnowledgeChunk): number => {
  const q = normalize(question);
  if (!q) return 0;

  let score = 0;
  for (const keyword of chunk.keywords) {
    const k = normalize(keyword);
    if (!k) continue;
    if (q.includes(k)) score += k.length > 8 ? 3 : 2;
  }

  for (const token of normalize(chunk.title).split(" ")) {
    if (token.length > 3 && q.includes(token)) score += 1;
  }

  // Strong boost for natural “what is GYGI” style questions on the about chunk.
  if (chunk.id === "about" && isAboutGygiIntent(question)) {
    score += 12;
  }

  return score;
};

const answerFromKnowledge = (
  question: string,
  liveCategories: string[],
): string => {
  const q = normalize(question);

  if (!q) {
    return "Ask me anything about GYGI — programs, mentorship, joining, certificates, and more.";
  }

  if (isAboutGygiIntent(question)) {
    const about = GYGI_KNOWLEDGE_CHUNKS.find((c) => c.id === "about");
    if (about) return about.content;
  }

  if (!GYGI_SIGNAL.test(question) && OFF_TOPIC_HARD.test(question)) {
    return "I focus on GYGI (Girls You Got It) — our free programs, mentorship, live classes, and how to get involved. What would you like to know about GYGI?";
  }

  const ranked = GYGI_KNOWLEDGE_CHUNKS.map((chunk) => ({
    chunk,
    score: scoreChunk(question, chunk),
  }))
    .filter((row) => row.score >= 2)
    .sort((a, b) => b.score - a.score);

  if (!GYGI_SIGNAL.test(question) && ranked.length === 0) {
    return `I can answer questions about GYGI programs, mentorship, live classes, certificates, community, and how to join. Try asking one of those — or contact us at ${GYGI_CONTACT.email} / ${GYGI_CONTACT.phone}.`;
  }

  if (
    !GYGI_SIGNAL.test(question) &&
    ranked.length > 0 &&
    ranked[0]!.score < 4 &&
    !q.includes("gygi")
  ) {
    return `I focus on GYGI topics. Ask about our free programs, mentorship, live classes, certificates, or how to join — or reach us at ${GYGI_CONTACT.email} / ${GYGI_CONTACT.phone}.`;
  }

  if (ranked.length > 0) {
    const best = ranked[0]!.score;
    const compound = /\b(and|also|plus)\b|[?,].+\?/i.test(question);
    const top = (
      compound
        ? ranked.filter((row) => row.score >= 2)
        : ranked.filter((row) => row.score >= Math.max(2, best - 1))
    ).slice(0, 2);

    let answer = top.map((row) => row.chunk.content).join(" ");

    if (
      top.some((row) => row.chunk.id === "programs") &&
      liveCategories.length > 0
    ) {
      answer += ` Right now, active categories include: ${liveCategories.join(", ")}.`;
    }

    return answer;
  }

  if (GYGI_SIGNAL.test(question) || q.includes("gygi")) {
    return `GYGI (Girls You Got It) offers free live learning, mentorship, community, certificates, and alumni support for girls and young women across Africa. Tell me which area you care about — joining, programs, mentorship, classes, certificates, or after graduation — or email ${GYGI_CONTACT.email} / call ${GYGI_CONTACT.phone}.`;
  }

  return `I can answer questions about GYGI programs, mentorship, live classes, certificates, community, and how to join. Try asking one of those — or contact us at ${GYGI_CONTACT.email} / ${GYGI_CONTACT.phone}.`;
};

const getLiveCategoryNames = async (): Promise<string[]> => {
  try {
    const rows = await Category.find({ isActive: { $ne: false } })
      .select("name")
      .sort({ name: 1 })
      .lean();
    return rows.map((r) => r.name).filter(Boolean);
  } catch {
    return [];
  }
};

const answerWithAi = async (
  question: string,
  history: ChatbotTurn[],
  liveCategories: string[],
): Promise<string> => {
  if (!env.googleAIKey) {
    throw new Error("AI key missing");
  }

  const google = createGoogleGenerativeAI({ apiKey: env.googleAIKey });
  const model = google("gemini-1.5-flash");
  const handbook = buildGygiHandbook(liveCategories);

  const prior = history
    .slice(-8)
    .map(
      (turn) =>
        `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`,
    )
    .join("\n");

  const prompt = `${handbook}

IMPORTANT:
- Users often speak short natural questions (voice notes), e.g. "what is gygi", "is it free", "how do I join".
- Speech-to-text may mishear GYGI as "gigi", "gee gee", etc. Treat those as GYGI.
- Always answer clearly about GYGI when the user is asking about the organization or platform.

CONVERSATION SO FAR:
${prior || "(none)"}

User: ${question}
Assistant:`;

  const { text } = await generateText({
    model,
    prompt,
  });

  const cleaned = (text || "").trim();
  if (!cleaned) {
    throw new Error("Empty AI response");
  }
  return cleaned;
};

/**
 * Answer a public FAQ chat question about GYGI.
 * Prefers Gemini when configured; always falls back to the GYGI knowledge base.
 */
export const answerGygiChatQuestion = async (
  question: string,
  history: ChatbotTurn[] = [],
): Promise<{ reply: string; source: "ai" | "knowledge" }> => {
  const trimmed = canonicalizeGygiQuestion(question).slice(0, 1000);
  const liveCategories = await getLiveCategoryNames();

  // Fast path for the most common voice/text opener — never fail this.
  if (isAboutGygiIntent(trimmed)) {
    return {
      reply: answerFromKnowledge(trimmed, liveCategories),
      source: "knowledge",
    };
  }

  if (env.googleAIKey) {
    try {
      const reply = await answerWithAi(trimmed, history, liveCategories);
      return { reply, source: "ai" };
    } catch (error) {
      console.error(
        "[chatbot] AI answer failed, using knowledge fallback:",
        error,
      );
    }
  }

  return {
    reply: answerFromKnowledge(trimmed, liveCategories),
    source: "knowledge",
  };
};
