import { useParams, useNavigate, useLocation } from "react-router";
import { useState, useCallback, useRef, useMemo } from "react";
import { useRecording } from "@/hooks/useRecording";
import { useAuth } from "@/hooks/useAuthContext";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  ListVideo,
  ArrowLeft,
  Bookmark,
  Share2,
  CheckCircle2,
  Lightbulb,
  Target,
  GraduationCap,
  Video,
  Search,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import RecordingPlayerComponent, {
  type RecordingPlayerHandle,
} from "@/components/recordings/RecordingPlayer";
import ChapterSidebar from "@/components/recordings/ChapterSidebar";
import TranscriptViewer from "@/components/recordings/TranscriptViewer";
import TranscriptSearch from "@/components/recordings/TranscriptSearch";
import AISummary from "@/components/recordings/AISummary";
import PracticeQuestions from "@/components/recordings/PracticeQuestions";
import ClassInteractions from "@/components/recordings/ClassInteractions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type StudyTab = "summary" | "transcript" | "practice" | "chapters" | "chat";

const RecordingPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const recordingsHome = useMemo(() => {
    if (pathname.startsWith("/super-admin/ops")) {
      return "/super-admin/ops/recordings";
    }
    if (pathname.startsWith("/admin")) return "/admin/recordings";
    if (pathname.startsWith("/tutor") || user?.role === "tutor") {
      return "/tutor/recordings";
    }
    return "/recordings";
  }, [pathname, user?.role]);
  const playerRef = useRef<RecordingPlayerHandle>(null);

  const {
    recording,
    playbackUrl,
    transcript,
    chapters,
    summary,
    aiNotes,
    practiceQuestions,
    interactions,
    loading,
    error,
    fetchPlaybackUrl,
  } = useRecording(id);

  const [currentTimestamp, setCurrentTimestamp] = useState<string>("");
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<StudyTab>("summary");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [panelQuery, setPanelQuery] = useState("");

  const handleChapterClick = useCallback((timestamp: string) => {
    setCurrentTimestamp(timestamp);
    playerRef.current?.seekToTimestamp(timestamp);
    setActiveTab("chapters");
  }, []);

  const handleTimestampClick = useCallback((timestamp: string) => {
    setCurrentTimestamp(timestamp);
    playerRef.current?.seekToTimestamp(timestamp);
    setActiveTab("transcript");
  }, []);

  const handleInteractionJump = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const stamp =
      h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
    setCurrentTimestamp(stamp);
    playerRef.current?.seekToTimestamp(stamp);
    setActiveTab("chat");
  }, []);

  const firstName = useMemo(
    () => user?.name?.trim().split(/\s+/)[0] || "there",
    [user?.name],
  );

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  if (!recording) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Video className="h-6 w-6 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Recording not found</h2>
        <p className="mt-1 text-sm text-slate-500">
          This class recording may have been removed.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate(recordingsHome)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Recordings
        </Button>
      </div>
    );
  }

  const isReady = recording.processingStatus === "ready";
  const canWatch =
    (typeof recording.fileSize === "number" && recording.fileSize > 0) ||
    isReady;
  const durationMins = Math.max(0, Math.round((recording.duration || 0) / 60));

  const insightItems = [
    {
      key: "summary" as const,
      label: "AI Summary",
      detail: summary ? "Ready to read" : "Generating…",
      ready: Boolean(summary),
      icon: Lightbulb,
      progress: summary ? 100 : isReady ? 35 : 15,
    },
    {
      key: "notes" as const,
      label: "Study Notes",
      detail: aiNotes ? "Ready to read" : "Generating…",
      ready: Boolean(aiNotes),
      icon: FileText,
      progress: aiNotes ? 100 : isReady ? 30 : 10,
    },
    {
      key: "practice" as const,
      label: "Practice Questions",
      detail:
        practiceQuestions.length > 0
          ? `${practiceQuestions.length} questions`
          : "Generating…",
      ready: practiceQuestions.length > 0,
      icon: Target,
      progress:
        practiceQuestions.length > 0
          ? 100
          : isReady
            ? 25
            : 8,
      tab: "practice" as StudyTab,
    },
    {
      key: "chapters" as const,
      label: "Chapters",
      detail:
        chapters.length > 0 ? `${chapters.length} sections` : "Generating…",
      ready: chapters.length > 0,
      icon: ListVideo,
      progress: chapters.length > 0 ? 100 : isReady ? 40 : 12,
      tab: "chapters" as StudyTab,
    },
  ];

  const studyTabs: { id: StudyTab; label: string; count?: number }[] = [
    { id: "summary", label: "Summary" },
    { id: "transcript", label: "Transcript" },
    {
      id: "chat",
      label: "Class chat",
      count: interactions.length || undefined,
    },
    {
      id: "practice",
      label: "Practice",
      count: practiceQuestions.length || undefined,
    },
    {
      id: "chapters",
      label: "Chapters",
      count: chapters.length || undefined,
    },
  ];

  return (
    <div className="relative -mx-1 min-h-[calc(100dvh-7rem)] animate-in fade-in duration-500">
      {/* Soft atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]"
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ───────── Main column ───────── */}
        <div className="min-w-0 space-y-5">
          {/* Greeting header */}
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(recordingsHome)}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[color-mix(in_srgb,var(--primary)_35%,white)] hover:text-[var(--primary)]"
                aria-label="Back to recordings"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.75rem]">
                  Hi, {firstName}!
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {recording.classId?.title || "Class Recording"}
                  </span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  <span>
                    {recording.category?.name || "GYGI"} · Recorded class
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full border-0 px-3 py-1 text-[11px] font-semibold",
                  isReady
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {isReady ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Clock className="mr-1 h-3 w-3" />
                )}
                {isReady ? "AI ready" : "AI processing"}
              </Badge>
              <button
                type="button"
                onClick={() => setIsBookmarked((v) => !v)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition",
                  isBookmarked
                    ? "border-[color-mix(in_srgb,var(--primary)_40%,white)] text-[var(--primary)]"
                    : "border-slate-200 text-slate-400 hover:text-slate-600",
                )}
                title="Bookmark"
              >
                <Bookmark
                  className={cn("h-4 w-4", isBookmarked && "fill-current")}
                />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-600"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Video stage */}
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {playbackUrl && canWatch ? (
              <RecordingPlayerComponent
                ref={playerRef}
                playbackUrl={playbackUrl}
                thumbnailUrl={recording.thumbnailUrl}
                title={recording.classId?.title}
                onTimeUpdate={setPlaybackSeconds}
              />
            ) : canWatch && !playbackUrl ? (
              <div className="flex aspect-video flex-col items-center justify-center rounded-[1.75rem] border border-rose-200 bg-rose-50 text-center shadow-sm">
                <Video className="mb-2 h-8 w-8 text-rose-500" />
                <p className="font-semibold text-rose-900">
                  Couldn’t load the video player
                </p>
                <p className="mt-1 max-w-sm text-sm text-rose-700">
                  {error || "Playback URL failed. Please try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void fetchPlaybackUrl()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-[1.75rem] border border-amber-200 bg-amber-50 text-center shadow-sm">
                <Clock className="mb-2 h-8 w-8 text-amber-500" />
                <p className="font-semibold text-amber-900">
                  Recording is being prepared
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  The video will be available to watch shortly.
                </p>
              </div>
            )}
          </section>

          {/* People / meta strip (participants-style) */}
          <section className="flex flex-wrap items-center gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3 pr-3 border-r border-slate-100">
              <Avatar className="h-11 w-11 ring-2 ring-white shadow">
                <AvatarImage
                  src={recording.tutor?.avatar}
                  alt={recording.tutor?.name}
                />
                <AvatarFallback className="bg-[color-mix(in_srgb,var(--primary)_12%,white)] font-bold text-[var(--primary)]">
                  {recording.tutor?.name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {recording.tutor?.name || "Tutor"}
                </p>
                <p className="text-[11px] text-slate-500">Instructor</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
                {format(new Date(recording.date), "MMM d, yyyy")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--primary)]" />
                {durationMins > 0 ? `${durationMins} min` : "Duration pending"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[var(--primary)]" />
                {recording.viewCount || 0} views
              </span>
              {recording.category?.name && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {recording.category.name}
                </span>
              )}
            </div>

            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-slate-200 text-xs"
                onClick={() => navigate("/mentorship")}
              >
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                Mentorship
              </Button>
            </div>
          </section>

          {/* Class insights */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Class insights
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Open study room
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {insightItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.tab) setActiveTab(item.tab);
                    else if (item.key === "summary" || item.key === "notes")
                      setActiveTab("summary");
                  }}
                  className="group rounded-[1.25rem] border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.label}
                        </p>
                        <Badge
                          className={cn(
                            "shrink-0 rounded-full border-0 text-[9px]",
                            item.ready
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {item.ready ? "Ready" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.detail}
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {playbackUrl && canWatch && !isReady && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Video is ready to watch. AI summary and transcript may still be
                generating.
              </p>
            )}
          </section>
        </div>

        {/* ───────── Right study room ───────── */}
        <aside className="flex min-h-0 flex-col gap-4 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={panelQuery}
                onChange={(e) => setPanelQuery(e.target.value)}
                placeholder="Search in study room…"
                className="h-11 rounded-full border-slate-200 bg-white pl-9 shadow-sm"
              />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_30%,transparent)]">
              <Brain className="h-4 w-4" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Study room</h3>
                <p className="text-[11px] text-slate-500">
                  Summary, chat, transcript & practice
                </p>
              </div>
              <Badge className="rounded-full border-0 bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[10px] text-[var(--primary)]">
                GYGI AI
              </Badge>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
              {studyTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.5 text-[9px]",
                        activeTab === tab.id
                          ? "bg-white/20"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[320px] flex-1 overflow-y-auto p-4">
              {activeTab === "summary" && (
                <div className="space-y-3">
                  <AISummary summary={summary} aiNotes={aiNotes} />
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="space-y-3">
                  <TranscriptSearch
                    recordingId={id!}
                    onJumpToTimestamp={handleTimestampClick}
                  />
                  <div className="h-[28rem] overflow-hidden rounded-2xl border border-slate-100">
                    <TranscriptViewer
                      transcript={
                        panelQuery.trim()
                          ? transcript
                              .split("\n")
                              .filter((line) =>
                                line
                                  .toLowerCase()
                                  .includes(panelQuery.trim().toLowerCase()),
                              )
                              .join("\n") || transcript
                          : transcript
                      }
                      onTimestampClick={handleTimestampClick}
                    />
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <ClassInteractions
                  messages={interactions}
                  currentTimeSeconds={playbackSeconds}
                  onJumpToOffset={handleInteractionJump}
                  query={panelQuery}
                  className="h-[28rem]"
                />
              )}

              {activeTab === "practice" && (
                <PracticeQuestions questions={practiceQuestions} />
              )}

              {activeTab === "chapters" && (
                <div className="h-[28rem]">
                  <ChapterSidebar
                    chapters={chapters}
                    currentChapter={currentTimestamp}
                    onChapterClick={handleChapterClick}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />
                Jump chapters, class chat, or search the transcript while you
                watch.
              </div>
            </div>
          </div>

          {/* Soft CTA — GYGI learning, not generic premium */}
          <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[color-mix(in_srgb,var(--primary)_18%,white)] via-sky-50 to-white p-5 shadow-sm ring-1 ring-[color-mix(in_srgb,var(--primary)_15%,transparent)]">
            <div className="relative z-10 max-w-[70%]">
              <p className="text-sm font-bold text-slate-900">Keep learning</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Catch up on more classes in your category, or book mentorship
                when you need a guide.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-[var(--primary)] px-3 text-xs text-white hover:brightness-110"
                  onClick={() => navigate(recordingsHome)}
                >
                  More recordings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-white/80 bg-white/70 px-3 text-xs"
                  onClick={() => navigate("/mentorship")}
                >
                  Mentorship
                </Button>
              </div>
            </div>
            <GraduationCap className="absolute -bottom-2 -right-2 h-24 w-24 rotate-12 text-[color-mix(in_srgb,var(--primary)_25%,transparent)]" />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RecordingPlayer;
