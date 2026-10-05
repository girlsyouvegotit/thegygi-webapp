import { create } from "zustand";
import { api } from "@/lib/api";
import type { community, communityMessage, channel } from "@/types";

interface CommunityState {
  community: community | null;
  messages: communityMessage[];
  activeChannel: channel | null;
  loading: boolean;
  error: string | null;
  fetchCommunity: (categoryId: string) => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setActiveChannel: (channel: channel | null) => void;
  addMessage: (message: communityMessage) => void;
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

export const useCommunityStore = create<CommunityState>((set, get) => ({
  community: null,
  messages: [],
  activeChannel: null,
  loading: false,
  error: null,

  fetchCommunity: async (categoryId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/communities/category/${categoryId}`);
      const communityData = data.data.community as community;
      set({
        community: communityData,
        activeChannel:
          communityData.channels.length > 0 ? communityData.channels[0] : null,
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to load community") });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (channelId: string): Promise<void> => {
    const communityData = get().community;
    if (!communityData) return;

    try {
      const { data } = await api.get(
        `/communities/${communityData._id}/channels/${channelId}/messages`,
      );
      set({ messages: data.data.messages as communityMessage[] });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to load messages") });
    }
  },

  sendMessage: async (content: string): Promise<void> => {
    const { community: communityData, activeChannel } = get();
    if (!communityData || !activeChannel) return;

    try {
      const { data } = await api.post(
        `/communities/${communityData._id}/channels/${activeChannel._id}/messages`,
        { content },
      );
      const newMessage = data.data.message as communityMessage;
      set(
        (state: CommunityState): Partial<CommunityState> => ({
          messages: [...state.messages, newMessage],
        }),
      );
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to send message") });
    }
  },

  setActiveChannel: (channel: channel | null): void => {
    set({ activeChannel: channel });
  },

  addMessage: (message: communityMessage): void => {
    set(
      (state: CommunityState): Partial<CommunityState> => ({
        messages: [...state.messages, message],
      }),
    );
  },
}));
