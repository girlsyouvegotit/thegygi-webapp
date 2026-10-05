import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import MessageItem from "./MessageItem";
import EmptyState from "@/components/global/EmptyState";

interface Message {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  createdAt: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  attachments?: string[];
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  currentUserId?: string;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const MessageList = ({
  messages,
  loading,
  currentUserId,
  onDelete,
  onPin,
  onLoadMore,
  hasMore,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);

    // Check if scrolled to top for loading more
    if (scrollTop === 0 && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Be the first to start the conversation!"
        icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  // Sort messages: pinned first, then by date
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Load more messages
          </button>
        </div>
      )}

      <div className="divide-y divide-border/50">
        {sortedMessages.map((message) => (
          <MessageItem
            key={message._id}
            message={message}
            isCurrentUser={message.user._id === currentUserId}
            onDelete={onDelete}
            onPin={onPin}
          />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
