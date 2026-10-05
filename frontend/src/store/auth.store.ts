import { create } from "zustand";
import { api } from "@/lib/api";
import type { user, category } from "@/types";

interface AuthState {
  user: user | null;
  categories: category[];
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: user | null) => void;
  setCategories: (categories: category[]) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    categoryId: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  categories: [],
  loading: true,
  isAuthenticated: false,

  setUser: (user: user | null): void => {
    set({ user, isAuthenticated: !!user });
  },

  setCategories: (categories: category[]): void => {
    set({ categories });
  },

  setLoading: (loading: boolean): void => {
    set({ loading });
  },

  signIn: async (email: string, password: string): Promise<void> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const userData = data.data?.user || data.user || data;
      set({ user: userData as user, isAuthenticated: true });
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Login failed"));
    }
  },

  signUp: async (
    name: string,
    email: string,
    password: string,
    categoryId: string,
  ): Promise<void> => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        categoryId,
      });
      const userData = data.data?.user || data.user || data;
      set({ user: userData as user, isAuthenticated: true });
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Registration failed"));
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error: unknown) {
      console.error("Logout failed:", error);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshUser: async (): Promise<void> => {
    try {
      const { data } = await api.get("/auth/me");
      const userData = data.data?.user || data.user || data;
      set({ user: userData as user, isAuthenticated: !!userData });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchCategories: async (): Promise<void> => {
    try {
      const { data } = await api.get("/categories");
      const list = (data?.data?.categories || data?.categories || []) as category[];
      set({
        categories: Array.isArray(list)
          ? list.map((c) => ({
              ...c,
              _id: String(c._id),
              studentCount:
                c.studentCount ??
                (Array.isArray(c.students) ? c.students.length : 0),
            }))
          : [],
      });
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error);
      set({ categories: [] });
    }
  },
}));
