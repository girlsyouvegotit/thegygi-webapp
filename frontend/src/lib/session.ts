const ACCESS_TOKEN_KEY = "gygi_access";

/** Session token for the Render API. The httpOnly cookie is not sent cross-site. */
export function readAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
  const token = data?.accessToken ?? body.accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}
