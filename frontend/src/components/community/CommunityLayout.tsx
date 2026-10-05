import { useState } from "react";
import { Users, Hash, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ChannelList from "./ChannelList";
import MemberList from "./MemberList";
import { Button } from "@/components/ui/button";

interface Channel {
  _id: string;
  name: string;
  type: "general" | "announcements" | "learning" | "mentorship";
  description?: string;
}

interface Member {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface CommunityLayoutProps {
  communityName: string;
  channels: Channel[];
  members: Member[];
  activeChannelId: string;
  onChannelSelect: (channelId: string) => void;
  children: React.ReactNode;
}

const CommunityLayout = ({
  communityName,
  channels,
  members,
  activeChannelId,
  onChannelSelect,
  children,
}: CommunityLayoutProps) => {
  const [showChannels, setShowChannels] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const activeChannel = channels.find((c) => c._id === activeChannelId);

  return (
    <div className="flex h-full bg-card rounded-lg border overflow-hidden">
      {/* Channels Sidebar */}
      <div
        className={cn(
          "w-64 border-r bg-muted/30 flex flex-col",
          showChannels ? "fixed inset-0 z-40 bg-background" : "hidden md:flex",
        )}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg truncate">{communityName}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowChannels(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onChannelSelect={(id) => {
              onChannelSelect(id);
              setShowChannels(false);
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowChannels(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <h3 className="font-medium truncate">
                {activeChannel?.name || "Channel"}
              </h3>
              {activeChannel?.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {activeChannel.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 flex flex-col min-w-0">{children}</div>

          {/* Members Sidebar */}
          {showMembers && (
            <div className="w-64 border-l bg-muted/30 hidden md:block">
              <MemberList members={members} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Members Overlay */}
      {showMembers && (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Members</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMembers(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <MemberList members={members} />
        </div>
      )}
    </div>
  );
};

export default CommunityLayout;
