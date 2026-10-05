import { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuthContext";
import type { Socket } from "socket.io-client";

interface ChatMessage {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date | string;
  type: "text" | "system" | "quiz" | "poll";
}

interface ChatPanelProps {
  socket: Socket | null;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Zoom-style persistent right dock on large screens */
  dock?: boolean;
}

const ChatPanel = ({
  socket,
  sessionId,
  isOpen,
  onClose,
  dock = false,
}: ChatPanelProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onNew = (message: ChatMessage) =>
      setMessages((prev) => [...prev, message]);
    const onHistory = (history: ChatMessage[]) => setMessages(history);
    const onTyping = (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (data.isTyping && data.userId !== user?._id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socket.on("new-message", onNew);
    socket.on("chat-history", onHistory);
    socket.on("user-typing", onTyping);

    return () => {
      socket.off("new-message", onNew);
      socket.off("chat-history", onHistory);
      socket.off("user-typing", onTyping);
    };
  }, [socket, user?._id]);

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("get-chat-history", { sessionId });
    }
  }, [socket, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !socket || !user) return;
    socket.emit("send-chat", {
      sessionId,
      message: inputValue.trim(),
      userName: user.name,
    });
    setInputValue("");
  }, [inputValue, socket, sessionId, user]);

  const handleTyping = useCallback(() => {
    if (!socket || !user) return;
    socket.emit("typing", {
      sessionId,
      userName: user.name,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        sessionId,
        userName: user.name,
        isTyping: false,
      });
    }, 1500);
  }, [socket, sessionId, user]);

  // Dock mode stays mounted on desktop even when "closed" on mobile
  if (!isOpen && !dock) return null;
  if (!isOpen && dock) {
    // Still render on lg+ as persistent panel
  }

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "bg-white flex flex-col z-50",
          // Mobile / tablet sheet when open
          isOpen
            ? "fixed inset-x-0 bottom-0 h-[75dvh] max-h-[600px] rounded-t-3xl border-t shadow-2xl pb-[env(safe-area-inset-bottom)] lg:static lg:inset-auto lg:h-full lg:max-h-none lg:rounded-[1.5rem] lg:border lg:border-slate-200/80 lg:shadow-sm lg:pb-0"
            : "hidden lg:flex lg:static lg:h-full lg:rounded-[1.5rem] lg:border lg:border-slate-200/80 lg:shadow-sm",
          dock && "lg:w-[340px] xl:w-[360px] shrink-0",
          !dock && "sm:w-80",
        )}
      >
        <div className="flex justify-center pt-2 pb-1 lg:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Class chat</h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {messages.length} messages
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat"
            className="h-9 w-9 lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 bg-[#FAFBFC]">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Say hello to the class</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `${message.userId}-${index}`}
                className={cn(
                  "flex gap-2",
                  message.userId === user?._id
                    ? "flex-row-reverse"
                    : "flex-row",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-slate-100">
                  <AvatarImage
                    src={message.userAvatar}
                    alt={message.userName}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {message.userName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[78%] px-3 py-2 rounded-2xl text-sm shadow-sm",
                    message.userId === user?._id
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-100 rounded-bl-md",
                  )}
                >
                  {message.type === "system" ? (
                    <p className="text-xs italic text-center opacity-80">
                      {message.message}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold opacity-90">
                          {message.userName}
                        </span>
                        {message.type === "quiz" && (
                          <Badge className="text-[9px] px-1 py-0 bg-emerald-100 text-emerald-700 border-0">
                            Quiz
                          </Badge>
                        )}
                        {message.type === "poll" && (
                          <Badge className="text-[9px] px-1 py-0 bg-sky-100 text-sky-700 border-0">
                            Poll
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm break-words leading-relaxed">
                        {message.message}
                      </p>
                      <p className="text-[9px] opacity-60 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-1 text-xs text-slate-400 px-1">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              Someone is typing…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              onChangeCapture={handleTyping}
              placeholder="Type your message..."
              inputMode="text"
              enterKeyHint="send"
              className="flex-1 h-11 rounded-full bg-slate-50 border-slate-200 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              size="icon"
              aria-label="Send message"
              className="h-11 w-11 rounded-full shrink-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;
