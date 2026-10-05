import { useState } from "react";
import { Pin, MoreVertical, Trash2, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

interface MessageItemProps {
  message: Message;
  isCurrentUser?: boolean;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
}

const MessageItem = ({
  message,
  isCurrentUser,
  onDelete,
  onPin,
}: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
        message.isPinned && "bg-yellow-50/50",
        message.isAnnouncement && "bg-purple-50/50",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={message.user.avatar} alt={message.user.name} />
        <AvatarFallback>{getInitials(message.user.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{message.user.name}</span>
          {message.user.role && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 capitalize"
            >
              {message.user.role}
            </Badge>
          )}
          {message.isAnnouncement && (
            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
              Announcement
            </Badge>
          )}
          {message.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), "MMM d, h:mm a")}
          </span>
        </div>

        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.attachments.map((att, index) => (
              <a
                key={index}
                href={att}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Attachment {index + 1}
              </a>
            ))}
          </div>
        )}
      </div>

      {showActions && !isCurrentUser && (
        <div className="shrink-0 self-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPin && (
                <DropdownMenuItem onClick={() => onPin(message._id)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {message.isPinned ? "Unpin" : "Pin"} message
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Report message
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(message._id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
