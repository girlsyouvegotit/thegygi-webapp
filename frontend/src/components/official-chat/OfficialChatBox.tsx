import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Send, Shield, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuthContext";
import { useOfficialChat } from "@/hooks/OfficialChatProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ThreadMessage = {
  _id: string;
  sender: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
};

type OfficialThread = {
  _id: string;
  subject: string;
  status: "open" | "closed";
  messages: ThreadMessage[];
  targetUser: string;
  actor: string;
  actorInfo?: { name?: string; role?: string };
  targetUserInfo?: { name?: string; role?: string };
};

export function OfficialChatBox() {
  const { user } = useAuth();
  const { isOpen, threadId, actionId, closeOfficialChat } = useOfficialChat();
  const [thread, setThread] = useState<OfficialThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadThread = useCallback(async () => {
    if (!threadId && !actionId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (threadId) params.threadId = threadId;
      if (actionId) params.actionId = actionId;
      const { data } = await api.get("/official-messages/resolve", { params });
      setThread(data.data.thread);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not open this conversation";
      toast.error(message);
      closeOfficialChat();
    } finally {
      setLoading(false);
    }
  }, [threadId, actionId, closeOfficialChat]);

  useEffect(() => {
    if (!isOpen) {
      setThread(null);
      setDraft("");
      return;
    }
    void loadThread();
  }, [isOpen, loadThread]);

  useEffect(() => {
    if (isOpen && thread) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, thread?.messages?.length, thread]);

  const handleSend = async () => {
    if (!thread || !draft.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(
        `/official-messages/${thread._id}/replies`,
        { message: draft.trim() },
      );
      setThread(data.data.thread);
      setDraft("");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send reply";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  const myId = user?._id ? String(user._id) : "";

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[220] flex items-end justify-end p-3 sm:p-5">
      <div
        className="pointer-events-auto absolute inset-0 bg-[#1C1C21]/25 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-0"
        onClick={closeOfficialChat}
        aria-hidden
      />

      <div
        role="dialog"
        aria-label="Official GYGI message"
        className="pointer-events-auto relative flex h-[min(72dvh,560px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background shadow-[0_24px_80px_rgba(28,28,33,0.28)]"
      >
        <div className="flex items-start gap-3 border-b border-border/80 bg-gradient-to-br from-[#2D2D44] to-[#3d2a55] px-4 py-3.5 text-white">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Shield className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">
              Official GYGI
            </p>
            <h3 className="truncate text-sm font-bold leading-snug">
              {thread?.subject || "Official message"}
            </h3>
            <p className="mt-0.5 text-[11px] text-white/65">
              {thread?.status === "closed"
                ? "Conversation closed"
                : "You can reply directly here"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeOfficialChat}
            className="h-8 w-8 shrink-0 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#F7F6FA] px-3 py-3">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !thread ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Conversation unavailable
            </div>
          ) : (
            thread.messages.map((m) => {
              const mine = String(m.sender) === myId;
              const isOfficial =
                m.senderRole === "super_admin" || m.senderRole === "admin";
              return (
                <div
                  key={m._id}
                  className={cn(
                    "flex",
                    mine ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : isOfficial
                          ? "rounded-bl-md border border-[#2D2D44]/10 bg-white text-slate-800"
                          : "rounded-bl-md bg-white text-slate-800",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          mine ? "text-white/80" : "text-slate-500",
                        )}
                      >
                        {mine
                          ? "You"
                          : isOfficial
                            ? "GYGI Official"
                            : m.senderName}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          mine ? "text-white/55" : "text-slate-400",
                        )}
                      >
                        {new Date(m.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {thread?.status !== "closed" ? (
          <div className="border-t border-border bg-background p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Write your reply…"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-[#F7F6FA] px-3.5 py-2.5 text-sm outline-none ring-primary/30 placeholder:text-slate-400 focus:ring-2"
              />
              <Button
                type="button"
                size="icon"
                disabled={!draft.trim() || sending}
                onClick={() => void handleSend()}
                className="h-11 w-11 shrink-0 rounded-2xl"
                aria-label="Send reply"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default OfficialChatBox;
