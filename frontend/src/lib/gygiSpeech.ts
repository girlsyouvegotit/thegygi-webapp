/**
 * Speech-to-text often mishears "GYGI" (especially with Nigerian English accents).
 * Normalize those aliases before sending to the assistant.
 */
export const canonicalizeGygiQuestion = (raw: string): string => {
  let text = raw.trim();
  if (!text) return text;

  text = text.replace(/\bgirls\s+you\s+got\s+it\b/gi, "GYGI");

  text = text
    .replace(/\bg\.?\s*y\.?\s*g\.?\s*i\.?\b/gi, "GYGI")
    .replace(/\bgee[\s-]?gee\b/gi, "GYGI")
    .replace(/\bgeegee\b/gi, "GYGI")
    .replace(/\bgeegi\b/gi, "GYGI")
    .replace(/\bgigi\b/gi, "GYGI")
    .replace(/\bgiji\b/gi, "GYGI")
    .replace(/\bjiji\b/gi, "GYGI")
    .replace(/\bguy\s*gee\b/gi, "GYGI")
    .replace(/\bg\s*y\s*g\s*i\b/gi, "GYGI")
    .replace(/\bgygy\b/gi, "GYGI")
    .replace(/\bgygee\b/gi, "GYGI");

  return text.replace(/\s+/g, " ").trim();
};
