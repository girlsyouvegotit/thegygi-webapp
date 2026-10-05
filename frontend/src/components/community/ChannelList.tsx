import { Hash, Megaphone, BookOpen, HeartHandshake, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Channel {
  _id: string;
  name: string;
  type: "general" | "announcements" | "learning" | "mentorship" | "self";
  description?: string;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

const ChannelList = ({
  channels,
  activeChannelId,
  onChannelSelect,
}: ChannelListProps) => {
  const getChannelIcon = (type: Channel["type"]) => {
    switch (type) {
      case "general":
        return <Hash className="h-4 w-4" />;
      case "announcements":
        return <Megaphone className="h-4 w-4" />;
      case "learning":
        return <BookOpen className="h-4 w-4" />;
      case "mentorship":
        return <HeartHandshake className="h-4 w-4" />;
      case "self":
        return <Lock className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getChannelColor = (type: Channel["type"]) => {
    switch (type) {
      case "announcements":
        return "text-amber-500";
      case "learning":
        return "text-blue-500";
      case "mentorship":
        return "text-purple-500";
      case "self":
        return "text-slate-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <button
          key={channel._id}
          onClick={() => onChannelSelect(channel._id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            activeChannelId === channel._id
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <span className={cn("shrink-0", getChannelColor(channel.type))}>
            {getChannelIcon(channel.type)}
          </span>
          <span className="flex-1 text-left truncate capitalize">
            {channel.name}
          </span>
          {channel.type === "announcements" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Important
            </Badge>
          )}
          {channel.type === "self" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Private
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChannelList;
