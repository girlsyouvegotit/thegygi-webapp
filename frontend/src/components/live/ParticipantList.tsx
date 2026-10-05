import { Users, MicOff, VideoOff, ScreenShare, Hand, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Participant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: "host" | "co_host" | "participant";
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  joinedAt?: Date;
}

interface ParticipantListProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  isHost?: boolean;
}

const ParticipantList = ({
  participants,
  isOpen,
  onClose,
  currentUserId,
}: ParticipantListProps) => {
  if (!isOpen) return null;

  const sortedParticipants = [...participants].sort((a, b) => {
    const roleOrder = { host: 0, co_host: 1, participant: 2 };
    return (
      roleOrder[a.role || "participant"] - roleOrder[b.role || "participant"]
    );
  });

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "bg-background flex flex-col z-50",
          // Mobile: bottom sheet
          "fixed inset-x-0 bottom-0 h-[70dvh] max-h-[550px]",
          "rounded-t-3xl border-t shadow-2xl",
          "pb-[env(safe-area-inset-bottom)]",
          // Desktop: side panel
          "sm:static sm:inset-auto sm:h-full sm:max-h-none",
          "sm:w-72 sm:rounded-none sm:border-t-0 sm:border-l sm:shadow-none sm:pb-0",
        )}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Participants</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {participants.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close participant list"
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* List — the only scrolling region */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No participants yet</p>
            </div>
          ) : (
            sortedParticipants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 sm:h-9 sm:w-9">
                    <AvatarImage
                      src={participant.userAvatar}
                      alt={participant.userName}
                    />
                    <AvatarFallback>
                      {participant.userName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isScreenSharing && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                      <ScreenShare className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {participant.userName}
                    </p>
                    {participant.userId === currentUserId && (
                      <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary">
                        You
                      </Badge>
                    )}
                    {participant.role === "host" && (
                      <Badge className="text-[9px] px-1 py-0 bg-yellow-100 text-yellow-700">
                        Host
                      </Badge>
                    )}
                    {participant.role === "co_host" && (
                      <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700">
                        Co-Host
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {participant.isHandRaised && (
                    <Hand className="w-4 h-4 text-yellow-500" />
                  )}
                  {participant.isMuted && (
                    <MicOff className="w-4 h-4 text-red-500" />
                  )}
                  {!participant.isVideoOn && (
                    <VideoOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantList;
