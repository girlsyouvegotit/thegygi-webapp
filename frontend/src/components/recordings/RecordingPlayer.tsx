import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface RecordingPlayerHandle {
  seekToTimestamp: (timestamp: string) => void;
}

interface RecordingPlayerProps {
  playbackUrl: string;
  thumbnailUrl?: string;
  title?: string;
  className?: string;
  onTimeUpdate?: (seconds: number) => void;
}

const parseTimestamp = (timestamp: string): number => {
  const parts = timestamp.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const RecordingPlayer = forwardRef<RecordingPlayerHandle, RecordingPlayerProps>(
  function RecordingPlayer(
    { playbackUrl, thumbnailUrl, title, className, onTimeUpdate },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [activeUrl, setActiveUrl] = useState(playbackUrl);

    // Reset playback UI when the source changes (render-time adjustment, not an effect).
    if (playbackUrl !== activeUrl) {
      setActiveUrl(playbackUrl);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    useImperativeHandle(ref, () => ({
      seekToTimestamp: (timestamp: string) => {
        const seconds = parseTimestamp(timestamp);
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
          setCurrentTime(seconds);
          void videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      },
    }));

    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        void video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    };

    const handleSeek = (value: number[]) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = value[0];
      setCurrentTime(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
      const video = videoRef.current;
      if (!video) return;
      const next = value[0];
      video.volume = next;
      video.muted = next === 0;
      setVolume(next);
      setIsMuted(next === 0);
    };

    const skip = (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(
        0,
        Math.min(video.duration || duration, video.currentTime + delta),
      );
      setCurrentTime(video.currentTime);
    };

    const toggleFullscreen = () => {
      const root = videoRef.current?.parentElement;
      if (!root) return;
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void root.requestFullscreen();
      }
    };

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/5 group",
          className,
        )}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      >
        <video
          ref={videoRef}
          src={playbackUrl}
          poster={thumbnailUrl || undefined}
          className="w-full aspect-video object-cover bg-slate-900"
          onTimeUpdate={() => {
            if (!videoRef.current) return;
            const t = videoRef.current.currentTime;
            setCurrentTime(t);
            onTimeUpdate?.(t);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration || 0);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
        />

        {/* Top badges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Recorded
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto rounded-full bg-black/35 p-2 text-white backdrop-blur transition hover:bg-black/50"
            aria-label="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        {title && (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-12 px-5 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="truncate text-sm font-medium text-white drop-shadow">
              {title}
            </p>
          </div>
        )}

        {/* Floating control dock */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-4 transition-all duration-300",
            showControls
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0",
          )}
        >
          <div className="mb-3 px-1">
            <Slider
              value={[currentTime]}
              max={Math.max(duration, 1)}
              step={0.1}
              onValueChange={handleSeek}
              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-white"
            />
            <div className="mt-1.5 flex justify-between text-[10px] font-medium text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/95 px-2.5 py-2 shadow-xl shadow-slate-900/20 backdrop-blur">
            <button
              type="button"
              onClick={() => skip(-10)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label="Back 10 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--primary)_35%,transparent)] transition hover:brightness-110"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current pl-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => skip(10)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label="Forward 10 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <div className="hidden w-20 pr-2 sm:block">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.05}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default RecordingPlayer;
