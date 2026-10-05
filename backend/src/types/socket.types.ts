import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface AuthSocket extends Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
> {
  userId?: string;
  userRole?: string;
}

export interface JoinClassPayload {
  classId: string;
  sessionId: string;
}

export interface ChatMessagePayload {
  sessionId: string;
  message: string;
  userName: string;
}

export interface QuizLaunchPayload {
  sessionId: string;
  quizId: string;
}

export interface PollPayload {
  sessionId: string;
  pollId: string;
  question: string;
  options: string[];
}

export interface PollResponsePayload {
  sessionId: string;
  pollId: string;
  optionIndex: number;
}

export interface CommunityJoinPayload {
  categoryId: string;
}

export interface CommunityMessagePayload {
  categoryId: string;
  channelId: string;
  content: string;
  userName: string;
}

export interface SocketEvents {
  "join-class": (payload: JoinClassPayload) => void;
  "leave-class": (payload: { sessionId: string }) => void;
  "send-chat": (payload: ChatMessagePayload) => void;
  "launch-quiz": (payload: QuizLaunchPayload) => void;
  "launch-poll": (payload: PollPayload) => void;
  "respond-poll": (payload: PollResponsePayload) => void;
  "join-community": (payload: CommunityJoinPayload) => void;
  "leave-community": (payload: CommunityJoinPayload) => void;
  "send-community-message": (payload: CommunityMessagePayload) => void;
  notification: (payload: { type: string; data: any }) => void;
}
