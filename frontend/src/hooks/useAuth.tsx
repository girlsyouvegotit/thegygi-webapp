import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { api } from "@/lib/api";
import type { user, category, UserRole } from "@/types";
import { AuthContext } from "./auth-context";
import type { AuthContextType, ImpersonationInfo } from "./auth-context";
import {
  clearImpersonationSession,
  readImpersonationSession,
  startActAs,
  stopActAs,
  writeImpersonationSession,
} from "@/lib/impersonation";

const VALID_ROLES: UserRole[] = [
  "student",
  "tutor",
  "mentor",
  "writer",
  "admin",
  "super_admin",
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

/** Only accept a well-formed user payload — never the raw API envelope. */
function extractUser(payload: unknown): user | null {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as Record<string, unknown>;
  const data = body.data;

  let candidate: unknown = undefined;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    candidate = nested.user ?? (nested.role && nested._id ? nested : undefined);
  }
  if (!candidate && body.user && typeof body.user === "object") {
    candidate = body.user;
  }
  if (
    !candidate &&
    typeof body.role === "string" &&
    (typeof body._id === "string" || typeof body.id === "string")
  ) {
    candidate = body;
  }

  if (!candidate || typeof candidate !== "object") return null;

  const u = candidate as Partial<user> & { id?: string };
  const id = u._id || u.id;
  if (!id || typeof u.role !== "string") return null;
  if (!VALID_ROLES.includes(u.role as UserRole)) return null;

  return { ...u, _id: String(id), role: u.role as UserRole } as user;
}

function extractImpersonation(
  payload: unknown,
  currentUser: user | null,
): ImpersonationInfo {
  const fromStored = (): ImpersonationInfo => {
    const stored = readImpersonationSession();
    if (!stored) return null;
    return {
      active: true,
      mode: "act_as",
      actor: stored.actor,
      watermark: stored.watermark,
      home: stored.home,
    };
  };

  if (!payload || typeof payload !== "object") {
    return fromStored();
  }

  const body = payload as Record<string, unknown>;
  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : body;
  const raw = data.impersonation;
  if (!raw || typeof raw !== "object") {
    if (!currentUser) clearImpersonationSession();
    return fromStored();
  }

  const info = raw as {
    active?: boolean;
    actor?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    watermark?: string;
    home?: string;
  };

  if (!info.active || !info.actor) {
    clearImpersonationSession();
    return null;
  }

  const stored = readImpersonationSession();
  if (stored && currentUser) {
    writeImpersonationSession({
      ...stored,
      watermark: info.watermark || stored.watermark,
      home: info.home || stored.home,
      actor: info.actor,
      target: {
        ...stored.target,
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
      },
    });
  }

  return {
    active: true,
    mode: "act_as",
    actor: info.actor,
    watermark: info.watermark,
    home: info.home,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<user | null>(null);
  const [impersonation, setImpersonation] = useState<ImpersonationInfo>(null);
  const [loading, setLoading] = useState(true);
  const authCheckRef = useRef(false);

  const categories = useMemo(() => {
    const raw = [
      ...(Array.isArray(user?.categories) ? user!.categories! : []),
      ...(Array.isArray(user?.assignedCategories)
        ? user!.assignedCategories!
        : []),
    ];
    const named = raw.filter((c): c is category => {
      if (!c || typeof c !== "object") return false;
      const cat = c as { _id?: unknown; name?: unknown };
      return (
        cat._id != null &&
        typeof cat.name === "string" &&
        cat.name.trim().length > 0
      );
    });
    return [...new Map(named.map((c) => [String(c._id), c])).values()];
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      const nextUser = extractUser(data);
      setUser(nextUser);
      setImpersonation(extractImpersonation(data, nextUser));
    } catch {
      setUser(null);
      setImpersonation(null);
      clearImpersonationSession();
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckRef.current) return;
      authCheckRef.current = true;

      try {
        const { data } = await api.get("/auth/me");
        const nextUser = extractUser(data);
        setUser(nextUser);
        setImpersonation(extractImpersonation(data, nextUser));
      } catch {
        setUser(null);
        setImpersonation(null);
        clearImpersonationSession();
      } finally {
        setLoading(false);
        authCheckRef.current = false;
      }
    };

    void checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<user> => {
    try {
      clearImpersonationSession();
      setImpersonation(null);
      const { data } = await api.post("/auth/login", { email, password });
      const userData = extractUser(data);
      if (!userData) {
        throw new Error("Login succeeded but user profile was invalid");
      }
      setUser(userData);
      return userData;
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Login failed"));
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    categoryId: string,
  ): Promise<void> => {
    try {
      clearImpersonationSession();
      setImpersonation(null);
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        categoryId,
      });
      const userData = extractUser(data);
      if (!userData) {
        throw new Error("Registration succeeded but user profile was invalid");
      }
      setUser(userData);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Registration failed"));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (impersonation?.active || readImpersonationSession()) {
        try {
          await api.post("/auth/stop-impersonation");
        } catch {
          /* still proceed to logout */
        }
      }
      await api.post("/auth/logout");
    } catch {
      // Silently handle logout errors
    } finally {
      clearImpersonationSession();
      setImpersonation(null);
      setUser(null);
    }
  };

  const beginImpersonation = async (userId: string): Promise<string> => {
    const result = await startActAs(userId);
    setUser(result.user);
    setImpersonation({
      active: true,
      mode: "act_as",
      actor: result.session.actor,
      watermark: result.session.watermark,
      home: result.session.home,
    });
    return result.home;
  };

  const endImpersonation = async (): Promise<string> => {
    const result = await stopActAs();
    setUser(result.user);
    setImpersonation(null);
    return result.home;
  };

  const value: AuthContextType = {
    user,
    setUser,
    loading,
    categories,
    impersonation,
    signIn,
    signUp,
    signOut,
    refreshUser,
    beginImpersonation,
    endImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
