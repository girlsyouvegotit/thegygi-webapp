import { useMemo, useState } from "react";
import {
  Copy,
  Flag,
  Forward,
  MessageCircle,
  MoreVertical,
  Pin,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { communityMessage, user } from "@/types";

const QUICK = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type MessageActionHandlers = {
  isAdmin: boolean;
  currentUserId: string;
  members: user[];
  onPin: (messageId: string) => Promise<void>;
  onStar: (messageId: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onDeleteMe: (messageId: string) => Promise<void>;
  onDeleteEveryone: (messageId: string) => Promise<void>;
  onReport: (messageId: string, reason: string) => Promise<void>;
  onReplyPrivate: (messageId: string) => Promise<void>;
  onForward: (messageId: string, toUserId: string) => Promise<void>;
  onQuoteReply?: (message: communityMessage) => void;
};

type Props = {
  message: communityMessage;
  handlers: MessageActionHandlers;
};

export function MessageActions({ message, handlers }: Props) {
  const [forwardOpen, setForwardOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [forwardQuery, setForwardQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const isMine =
    String(message.user?._id || message.user) === handlers.currentUserId;

  const forwardCandidates = useMemo(() => {
    const q = forwardQuery.trim().toLowerCase();
    return (handlers.members || [])
      .filter((m) => String(m._id) !== handlers.currentUserId)
      .filter(
        (m) =>
          !q ||
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      );
  }, [handlers.members, handlers.currentUserId, forwardQuery]);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Action failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        <div className="hidden sm:flex items-center rounded-full border border-border bg-white shadow-sm px-1 py-0.5">
          {QUICK.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={busy}
              title="Quick reply"
              onClick={() =>
                void run(() => handlers.onReact(message._id, emoji))
              }
              className="h-7 w-7 rounded-full text-sm hover:bg-muted transition"
            >
              {emoji}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={busy}
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => handlers.onQuoteReply?.(message)}
            >
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </DropdownMenuItem>
            {!isMine ? (
              <DropdownMenuItem
                onClick={() =>
                  void run(
                    () => handlers.onReplyPrivate(message._id),
                    "Opened private chat",
                  )
                }
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Reply privately
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setForwardOpen(true)}>
              <Forward className="mr-2 h-4 w-4" />
              Forward to member
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void run(
                  () => handlers.onStar(message._id),
                  message.isStarredByMe ? "Star removed" : "Starred",
                )
              }
            >
              <Star
                className={cn(
                  "mr-2 h-4 w-4",
                  message.isStarredByMe && "fill-amber-400 text-amber-500",
                )}
              />
              {message.isStarredByMe ? "Unstar" : "Star"}
            </DropdownMenuItem>
            {handlers.isAdmin ? (
              <DropdownMenuItem
                onClick={() =>
                  void run(
                    () => handlers.onPin(message._id),
                    message.isPinned ? "Unpinned" : "Pinned",
                  )
                }
              >
                <Pin className="mr-2 h-4 w-4" />
                {message.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => void copyText()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                void run(
                  () => handlers.onDeleteMe(message._id),
                  "Deleted for you",
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete for me
            </DropdownMenuItem>
            {(isMine || handlers.isAdmin) && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() =>
                  void run(
                    () => handlers.onDeleteEveryone(message._id),
                    "Deleted for everyone",
                  )
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete for everyone
              </DropdownMenuItem>
            )}
            {!isMine ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-amber-700 focus:text-amber-700"
                  onClick={() => setReportOpen(true)}
                  disabled={message.reportedByMe}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {message.reportedByMe ? "Already reported" : "Report"}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forward to a community member</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search members…"
            value={forwardQuery}
            onChange={(e) => setForwardQuery(e.target.value)}
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {forwardCandidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No members found
              </p>
            ) : (
              forwardCandidates.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await handlers.onForward(message._id, String(m._id));
                      setForwardOpen(false);
                      setForwardQuery("");
                    }, `Forwarded to ${m.name}`)
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatar} alt={m.name} />
                    <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {m.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground capitalize">
                      {m.role}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Community admins (course tutors) will be notified.
          </p>
          <Input
            placeholder="Why are you reporting this?"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <Button
            disabled={busy || reportReason.trim().length < 3}
            onClick={() =>
              void run(async () => {
                await handlers.onReport(message._id, reportReason.trim());
                setReportOpen(false);
                setReportReason("");
              }, "Report sent to admins")
            }
          >
            Submit report
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MessageActions;
