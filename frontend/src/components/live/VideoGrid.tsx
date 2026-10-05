import { useEffect, useRef } from "react";
import { MicOff, VideoOff, ScreenShare, Maximize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface VideoParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  stream?: MediaStream | null;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
}

interface VideoGridProps {
  participants: VideoParticipant[];
  currentUserId?: string;
  maxVisible?: number;
  classTitle?: string;
  controlsSlot?: React.ReactNode;
}

const MainStage = ({
  participant,
  currentUserId,
  controlsSlot,
}: {
  participant: VideoParticipant;
  currentUserId?: string;
  controlsSlot?: React.ReactNode;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (participant.stream && participant.isVideoOn) {
      el.srcObject = participant.stream;
    } else {
      el.srcObject = null;
    }
  }, [participant.stream, participant.isVideoOn]);

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[360px] rounded-[1.5rem] overflow-hidden bg-slate-900 shadow-lg border border-slate-200/60">
      {participant.stream && participant.isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.userId === currentUserId}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a1038]">
          <Avatar className="h-28 w-28 border-4 border-white/10 shadow-2xl">
            <AvatarImage
              src={participant.userAvatar}
              alt={participant.userName}
            />
            <AvatarFallback className="text-3xl bg-primary/40 text-white font-black">
              {participant.userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-[11px] font-bold text-slate-800 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        Live
      </div>

      <button
        type="button"
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow-sm hover:bg-white"
        aria-label="Fullscreen"
        onClick={() => {
          const root = videoRef.current?.parentElement;
          if (root && root.requestFullscreen) void root.requestFullscreen();
        }}
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {participant.isScreenSharing && (
        <div className="absolute top-3 left-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow">
          <ScreenShare className="w-3 h-3" />
          Sharing
        </div>
      )}

      <div className="absolute bottom-16 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-xs font-semibold">
        <span className="truncate max-w-[160px]">{participant.userName}</span>
        {participant.userId === currentUserId && (
          <span className="text-[9px] text-white/70">(You)</span>
        )}
        {participant.isMuted && <MicOff className="w-3.5 h-3.5 text-rose-300" />}
        {!participant.isVideoOn && (
          <VideoOff className="w-3.5 h-3.5 text-white/70" />
        )}
      </div>

      {controlsSlot}
    </div>
  );
};

const StripAvatar = ({
  participant,
  currentUserId,
}: {
  participant: VideoParticipant;
  currentUserId?: string;
}) => (
  <div className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]">
    <div className="relative">
      <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-slate-100">
        <AvatarImage src={participant.userAvatar} alt={participant.userName} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {participant.userName?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white",
          participant.isMuted ? "bg-rose-400" : "bg-primary",
        )}
      />
    </div>
    <p className="text-[10px] font-semibold text-slate-600 truncate w-full text-center">
      {participant.userId === currentUserId
        ? "You"
        : participant.userName?.split(" ")[0]}
    </p>
  </div>
);

const VideoGrid = ({
  participants,
  currentUserId,
  maxVisible = 8,
  controlsSlot,
}: VideoGridProps) => {
  const featured =
    participants.find((p) => p.userId === currentUserId) || participants[0];
  const strip = participants.slice(0, maxVisible);
  const more = Math.max(0, participants.length - maxVisible);

  if (!featured) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-[1.5rem] bg-slate-100 border border-slate-200 min-h-[280px]">
        <p className="text-sm text-slate-400 font-medium">
          Waiting for camera…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      <div className="relative flex-1 min-h-0">
        <MainStage
          participant={featured}
          currentUserId={currentUserId}
          controlsSlot={controlsSlot}
        />
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {strip.map((p) => (
          <StripAvatar
            key={p.userId}
            participant={p}
            currentUserId={currentUserId}
          />
        ))}
        {more > 0 && (
          <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
            +{more}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;
