import { useState, useRef } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string, attachments?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput = ({
  onSend,
  disabled,
  placeholder = "Type a message...",
}: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await onSend(content.trim());
      setContent("");
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className={cn(
              "resize-none min-h-[40px] max-h-[120px] py-2.5 pr-10",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 h-8 w-8"
            disabled={disabled}
            type="button"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          size="icon"
          className="h-10 w-10 shrink-0"
          type="button"
          title="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
