import { create } from "zustand";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { liveClass, liveSession } from "@/types";

interface Participant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: "host" | "co_host" | "participant";
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
}

interface ClassState {
  liveClass: liveClass | null;
  session: liveSession | null;
  participants: Participant[];
  loading: boolean;
  error: string | null;
  fetchClass: (classId: string) => Promise<void>;
  fetchSession: (classId: string) => Promise<void>;
  startClass: (classId: string) => Promise<void>;
  endClass: (classId: string) => Promise<void>;
  joinClass: (classId: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
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

export const useClassStore = create<ClassState>((set, get) => ({
  liveClass: null,
  session: null,
  participants: [],
  loading: false,
  error: null,

  fetchClass: async (classId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/classes/${classId}`);
      set({ liveClass: data.data.class as liveClass });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to load class") });
    } finally {
      set({ loading: false });
    }
  },

  fetchSession: async (classId: string): Promise<void> => {
    try {
      const { data } = await api.get(`/classes/${classId}/session`);
      const sessionData = data.data.session as liveSession;
      set({
        session: sessionData,
        participants: (sessionData.participants as Participant[]) || [],
      });
    } catch {
      set({ session: null, participants: [] });
    }
  },

  startClass: async (classId: string): Promise<void> => {
    set({ error: null });
    try {
      const { data } = await api.post(`/classes/${classId}/start`);
      set({ session: data.data.session as liveSession });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to start class") });
      throw error;
    }
  },

  endClass: async (classId: string): Promise<void> => {
    set({ error: null });
    try {
      await api.post(`/classes/${classId}/end`);
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to end class") });
      throw error;
    }
  },

  joinClass: async (classId: string): Promise<void> => {
    set({ error: null });
    try {
      await api.post(`/classes/${classId}/join`);
      const socket = getSocket();
      const session = get().session;
      if (socket && session) {
        socket.emit("join-class", { sessionId: session._id });
      }
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to join class") });
      throw error;
    }
  },

  leaveClass: async (classId: string): Promise<void> => {
    set({ error: null });
    try {
      await api.post(`/classes/${classId}/leave`);
      const socket = getSocket();
      const session = get().session;
      if (socket && session) {
        socket.emit("leave-class", { sessionId: session._id });
      }
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to leave class") });
    }
  },

  addParticipant: (participant: Participant): void => {
    set((state: ClassState): Partial<ClassState> => ({
      participants: [...state.participants, participant],
    }));
  },

  removeParticipant: (userId: string): void => {
    set((state: ClassState): Partial<ClassState> => ({
      participants: state.participants.filter(
        (p: Participant) => p.userId !== userId,
      ),
    }));
  },
}));