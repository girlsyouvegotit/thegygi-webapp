import { create } from "zustand";
import { getSocket } from "@/lib/socket";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "quiz" | "poll";
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  typingUser: string | null;
  sendMessage: (sessionId: string, message: string, userName: string) => void;
  setTyping: (sessionId: string, userName: string, isTyping: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  typingUser: null,

  sendMessage: (sessionId: string, message: string, userName: string): void => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("send-chat", { sessionId, message, userName });
  },

  setTyping: (sessionId: string, userName: string, isTyping: boolean): void => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("typing", { sessionId, userName, isTyping });
    set({ isTyping, typingUser: isTyping ? userName : null });
  },

  addMessage: (message: ChatMessage): void => {
    set(
      (state: ChatState): Partial<ChatState> => ({
        messages: [...state.messages, message],
      }),
    );
  },

  clearMessages: (): void => {
    set({ messages: [] });
  },
}));
