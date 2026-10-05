const CLIENT_KEY = "gygi_testimonial_client_key";

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `gygi_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable anonymous key for like toggles (browser-local). */
export function getTestimonialClientKey(): string {
  if (typeof window === "undefined") return randomKey();
  try {
    const existing = window.localStorage.getItem(CLIENT_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = randomKey();
    window.localStorage.setItem(CLIENT_KEY, next);
    return next;
  } catch {
    return randomKey();
  }
}
