import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  PhoneOff,
  Hand,
  Circle,
  Loader2,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isParticipantListOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleChat: () => void;
  onToggleParticipantList: () => void;
  onLeaveClass: () => void;
  participantCount?: number;
  unreadMessages?: number;

  canRecord?: boolean;
  isRecording?: boolean;
  isUploadingRecording?: boolean;
  recordingSeconds?: number;
  uploadProgress?: number;
  onToggleRecording?: () => void;

  isHost?: boolean;
  isEndingClass?: boolean;
  onEndClass?: () => void;

  /** Overlay floating on the video stage (Zoom-style) */
  overlay?: boolean;
}

const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

const ControlButton = ({
  active,
  danger,
  soft,
  onClick,
  disabled,
  label,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  soft?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={cn(
      "relative h-11 w-11 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-50",
      danger
        ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/30"
        : active
          ? "bg-primary text-white shadow-md shadow-primary/25"
          : soft
            ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
            : "bg-white/15 text-white hover:bg-white/25",
    )}
  >
    {children}
  </button>
);

const ClassControls = ({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isHandRaised,
  isChatOpen,
  isParticipantListOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleChat,
  onToggleParticipantList,
  onLeaveClass,
  participantCount = 0,
  unreadMessages = 0,
  canRecord = false,
  isRecording = false,
  isUploadingRecording = false,
  recordingSeconds = 0,
  uploadProgress = 0,
  onToggleRecording,
  isHost = false,
  isEndingClass = false,
  onEndClass,
  overlay = true,
}: ClassControlsProps) => {
  const soft = !overlay;

  return (
    <div
      className={cn(
        overlay
          ? "absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 pointer-events-none px-3"
          : "relative z-20 pointer-events-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      {(isRecording || isUploadingRecording) && (
        <div className="pointer-events-none w-full max-w-xs">
          <div className="rounded-2xl bg-white/95 backdrop-blur border border-slate-200 shadow-lg px-3 py-2">
            {isUploadingRecording ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Saving recording…
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(4, uploadProgress)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                REC · {formatDuration(recordingSeconds)}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center",
          "rounded-full px-3 sm:px-4 py-2.5 shadow-xl",
          overlay
            ? "bg-slate-900/90 backdrop-blur-xl border border-white/10"
            : "bg-white border border-slate-200",
        )}
      >
        <ControlButton
          soft={soft}
          danger={isMuted}
          onClick={onToggleMute}
          label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </ControlButton>

        <ControlButton
          soft={soft}
          danger={!isVideoOn}
          onClick={onToggleVideo}
          label={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </ControlButton>

        <ControlButton
          soft={soft}
          active={isScreenSharing}
          onClick={onToggleScreenShare}
          label="Share screen"
        >
          <ScreenShare className="h-5 w-5" />
        </ControlButton>

        {canRecord && (
          <ControlButton
            soft={soft}
            danger={isRecording}
            onClick={onToggleRecording}
            disabled={isUploadingRecording || isEndingClass}
            label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isUploadingRecording ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <Square className="h-4 w-4 fill-white" />
            ) : (
              <Circle className="h-5 w-5 fill-rose-500 text-rose-500" />
            )}
          </ControlButton>
        )}

        <ControlButton
          soft={soft}
          active={isHandRaised}
          onClick={onToggleHandRaise}
          label={isHandRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="h-5 w-5" />
        </ControlButton>

        <ControlButton
          soft={soft}
          active={isChatOpen}
          onClick={onToggleChat}
          label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </ControlButton>

        <ControlButton
          soft={soft}
          active={isParticipantListOpen}
          onClick={onToggleParticipantList}
          label="Participants"
        >
          <Users className="h-5 w-5" />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {participantCount > 99 ? "99+" : participantCount}
            </span>
          )}
        </ControlButton>

        {isHost && onEndClass && (
          <button
            type="button"
            onClick={onEndClass}
            disabled={isEndingClass || isUploadingRecording}
            className="h-11 px-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {isEndingClass ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3.5 h-3.5 fill-white" />
            )}
            End
          </button>
        )}

        <ControlButton soft={soft} danger onClick={onLeaveClass} label="Leave">
          <PhoneOff className="h-5 w-5" />
        </ControlButton>
      </div>
    </div>
  );
};

export default ClassControls;
