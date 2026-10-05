import { env } from "./env.js";

/**
 * Unified browser origin allow-list for HTTP CORS and Socket.IO.
 * SOCKET_CORS_ORIGIN may be a comma-separated list; always includes CLIENT_URL
 * and the known production Vercel host.
 */
export function getAllowedOrigins(): string[] {
  const fromSocketEnv = (env.socket.corsOrigin || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const origins = [
    env.clientUrl,
    ...fromSocketEnv,
    "https://gygingo.vercel.app",
    ...(env.nodeEnv === "development"
      ? [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://127.0.0.1:5173",
        ]
      : []),
  ];

  return [...new Set(origins.filter(Boolean))];
}
