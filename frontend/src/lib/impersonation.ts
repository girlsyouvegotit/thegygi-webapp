import { api } from "@/lib/api";
import type { user } from "@/types";

export const IMPERSONATION_STORAGE_KEY = "gygi_impersonation";

export type ImpersonationSession = {
  mode: "act_as";
  watermark: string;
  home: string;
  target: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  actor: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  startedAt: string;
};

export type StartImpersonationResult = {
  user: user;
  home: string;
  session: ImpersonationSession;
};

type ApiEnvelope = {
  data?: {
    user?: user;
    home?: string;
    watermark?: string;
    mode?: string;
    target?: ImpersonationSession["target"];
    actor?: ImpersonationSession["actor"];
  };
};

export function readImpersonationSession(): ImpersonationSession | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationSession;
  } catch {
    sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    return null;
  }
}

export function writeImpersonationSession(session: ImpersonationSession): void {
  sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session));
}

export function clearImpersonationSession(): void {
  sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
}

export async function startActAs(
  userId: string,
): Promise<StartImpersonationResult> {
  const { data } = await api.post<ApiEnvelope>(
    `/super-admin/people/${userId}/impersonate`,
  );
  const payload = data.data;
  if (!payload?.user || !payload.home || !payload.target || !payload.actor) {
    throw new Error("Impersonation response was incomplete");
  }

  const session: ImpersonationSession = {
    mode: "act_as",
    watermark: payload.watermark || `ACTING AS ${payload.target.role}`,
    home: payload.home,
    target: payload.target,
    actor: payload.actor,
    startedAt: new Date().toISOString(),
  };
  writeImpersonationSession(session);

  return {
    user: payload.user,
    home: payload.home,
    session,
  };
}

export async function stopActAs(): Promise<{ user: user; home: string }> {
  const { data } = await api.post<ApiEnvelope>("/auth/stop-impersonation");
  clearImpersonationSession();
  const payload = data.data;
  if (!payload?.user) {
    throw new Error("Could not restore super-admin session");
  }
  return {
    user: payload.user,
    home: payload.home || "/super-admin/people",
  };
}
