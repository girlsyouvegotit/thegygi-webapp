import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Clock, Calendar, Video, Radio, Users, CircleDot } from "lucide-react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import VideoGrid from "./VideoGrid";
import ClassControls from "./ClassControls";
import ChatPanel from "./ChatPanel";
import ParticipantList from "./ParticipantList";
import ScreenShare from "./ScreenShare";
import LiveQuizPopup from "./LiveQuizPopup";
import PollPopup from "./PollPopup";
import type { liveClass } from "@/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

interface QuizData {
  quizId: string;
  question: {
    _id: string;
    type: "MCQ" | "multiple_select" | "true_false";
    questionText: string;
    options?: string[];
    points: number;
  };
  timeLeft: number;
  totalQuestions: number;
  currentQuestionIndex: number;
}

interface PollData {
  pollId: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
  hasVoted: boolean;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; liveClass: liveClass };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatScheduled = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const LOAD_TIMEOUT_MS = 15000;
const MAX_RECORDING_BYTES = 200 * 1024 * 1024; // 200 MB

const pickRecordingMimeType = (): {
  recorderMime: string;
  headerMime: string;
} => {
  if (typeof MediaRecorder === "undefined") {
    return { recorderMime: "", headerMime: "application/octet-stream" };
  }
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        const headerMime = type.split(";")[0].trim();
        return { recorderMime: type, headerMime };
      }
    } catch {
      /* ignore */
    }
  }
  return { recorderMime: "", headerMime: "application/octet-stream" };
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const LiveClassroom = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [startingClass, setStartingClass] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [endingClass, setEndingClass] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingHeaderMimeRef = useRef<string>("application/octet-stream");
  const recordingSecondsRef = useRef(0);
  const recordingStartedAtRef = useRef<string | null>(null);
  const uploadResolveRef = useRef<((ok: boolean) => void) | null>(null);
  const leavingRef = useRef(false);
  /** Prevents class-ended socket from navigating away mid-upload. */
  const stayForUploadRef = useRef(false);
  const autoRecordStartedRef = useRef(false);
  /** Canvas compositor so screen-share can replace camera mid-recording. */
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingRafRef = useRef<number | null>(null);
  const recordingMixStreamRef = useRef<MediaStream | null>(null);
  const recordingAudioClonesRef = useRef<MediaStreamTrack[]>([]);

  // ──────────────────────────────────────────
  // 1. Fetch class data
  // ──────────────────────────────────────────
  const fetchClass = useCallback(async () => {
    if (!classId) {
      setState({
        kind: "error",
        message: "No class ID was provided in the URL.",
      });
      return;
    }

    setState({ kind: "loading" });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);

    try {
      const { data } = await api.get(`/classes/${classId}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      const liveClass = data.data.class as liveClass;
      if (!liveClass) {
        setState({
          kind: "error",
          message: "Class data was missing from the server response.",
        });
        return;
      }
      setState({ kind: "ready", liveClass });
    } catch (error: unknown) {
      window.clearTimeout(timer);
      const err = error as {
        name?: string;
        response?: { data?: { message?: string } };
        message?: string;
      };
      let message = "Unable to load the class.";
      if (err.name === "CanceledError" || err.name === "AbortError") {
        message = "The server took too long to respond. Please try again.";
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      setState({ kind: "error", message });
    }
  }, [classId]);

  useEffect(() => {
    void fetchClass();
  }, [fetchClass]);

  // ──────────────────────────────────────────
  // 2. Availability
  // ──────────────────────────────────────────
  const availability = useMemo(() => {
    if (state.kind !== "ready") return null;
    const cls = state.liveClass;
    const now = new Date();
    const scheduled = new Date(cls.scheduledDate);

    if (cls.status === "live") return { kind: "live" as const };
    if (
      cls.status === "ended" ||
      cls.status === "processing" ||
      cls.status === "recorded" ||
      cls.status === "cancelled"
    ) {
      return { kind: "unavailable" as const, status: cls.status };
    }
    if (cls.status === "scheduled" && now.getTime() < scheduled.getTime()) {
      return { kind: "future" as const, scheduled };
    }
    if (cls.status === "scheduled") {
      return { kind: "readyToStart" as const };
    }
    return { kind: "unavailable" as const, status: cls.status };
  }, [state]);

  // ──────────────────────────────────────────
  // 3. Socket
  // ──────────────────────────────────────────
  useEffect(() => {
    if (state.kind !== "ready") return;
    if (!classId || !user) return;

    const sessionId = state.liveClass.sessionId;
    if (!sessionId) return;

    const token =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("jwt="))
        ?.split("=")[1] || undefined;

    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { withCredentials: true, auth: { token } },
    );

    socketRef.current = newSocket;
    setSocket(newSocket);

    const onConnect = () => newSocket.emit("join-class", { sessionId });
    const onUserJoined = (data: Participant) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };
    const onUserLeft = (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    };
    const onQuiz = (data: QuizData) => setActiveQuiz(data);
    const onPoll = (data: PollData) => setActivePoll(data);

    newSocket.on("connect", onConnect);
    newSocket.on("user-joined", onUserJoined);
    newSocket.on("user-left", onUserLeft);
    newSocket.on("quiz-launched", onQuiz);
    newSocket.on("poll-launched", onPoll);
    const onClassEnded = () => {
      // Host is saving the recording — don't tear down the room yet.
      if (stayForUploadRef.current) return;
      toast.message("This class has ended");
      if (user?.role === "tutor" || user?.role === "admin") {
        navigate("/tutor/classes");
      } else {
        navigate("/live-classes");
      }
    };
    newSocket.on("class-ended", onClassEnded);

    return () => {
      newSocket.emit("leave-class", { sessionId });
      newSocket.off("connect", onConnect);
      newSocket.off("user-joined", onUserJoined);
      newSocket.off("user-left", onUserLeft);
      newSocket.off("quiz-launched", onQuiz);
      newSocket.off("poll-launched", onPoll);
      newSocket.off("class-ended", onClassEnded);
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [state, classId, user, navigate]);

  // ──────────────────────────────────────────
  // 4. Local media
  // ──────────────────────────────────────────
  useEffect(() => {
    if (state.kind !== "ready") return;
    if (state.liveClass.status !== "live") return;

    let cancelled = false;

    const init = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Your browser does not support camera/microphone access.",
          );
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        // Hosts keep mic live so teaching + recording capture audio.
        // Students start muted for privacy.
        const hostId =
          state.kind === "ready"
            ? state.liveClass.tutor?._id || state.liveClass.tutor
            : null;
        const isHostUser =
          user?.role === "admin" ||
          (hostId != null && String(hostId) === String(user?._id));
        stream.getAudioTracks().forEach((t) => {
          t.enabled = isHostUser;
        });
        setIsMuted(!isHostUser);
        setLocalStream(stream);
        setMediaError(null);
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as { name?: string };
        let message =
          "Unable to access camera or microphone. You can still see the class, chat, and participants.";
        if (err.name === "NotAllowedError") {
          message =
            "Camera and microphone access was denied. Enable it in your browser settings to appear on video.";
        } else if (err.name === "NotFoundError") {
          message =
            "No camera or microphone was found on this device. You can still participate in chat.";
        } else if (err.name === "NotReadableError") {
          message =
            "Your camera or microphone is in use by another application. Close it and reload to appear on video.";
        }
        setMediaError(message);
        toast.error(message);
      }
    };

    void init();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };
  }, [state, user?._id, user?.role]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      if (recordingRafRef.current != null) {
        cancelAnimationFrame(recordingRafRef.current);
        recordingRafRef.current = null;
      }
      recordingAudioClonesRef.current.forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      recordingAudioClonesRef.current = [];
      if (recordingVideoRef.current) {
        recordingVideoRef.current.pause();
        recordingVideoRef.current.srcObject = null;
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
    };
  }, []);

  // ──────────────────────────────────────────
  // 5. Controls
  // ──────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOn((prev) => {
      const next = !prev;
      localStreamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
  }, []);

  const syncRecordingVideoSource = useCallback(() => {
    const video = recordingVideoRef.current;
    if (!video) return;
    const screen = screenStreamRef.current;
    const cam = localStreamRef.current;
    const next =
      screen && screen.getVideoTracks().some((t) => t.readyState === "live")
        ? screen
        : cam;
    if (video.srcObject !== next) {
      video.srcObject = next;
      void video.play().catch(() => {});
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      socketRef.current?.emit("stop-screen-share", { sessionId: classId });
      // Fall back to camera in the recording compositor.
      syncRecordingVideoSource();
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          // Tab/system audio when the browser offers it.
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);
      socketRef.current?.emit("start-screen-share", { sessionId: classId });
      // Swap the recording canvas onto the shared screen immediately.
      syncRecordingVideoSource();
      if (mediaRecorderRef.current?.state === "recording") {
        toast.message("Screen is now being recorded");
      }

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        setIsScreenSharing(false);
        socketRef.current?.emit("stop-screen-share", { sessionId: classId });
        syncRecordingVideoSource();
      });
    } catch (error) {
      const err = error as { name?: string };
      if (err.name !== "NotAllowedError") {
        toast.error("Failed to share screen");
      }
    }
  }, [isScreenSharing, classId, syncRecordingVideoSource]);

  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => {
      const next = !prev;
      socketRef.current?.emit("raise-hand", {
        sessionId: classId,
        raised: next,
      });
      return next;
    });
  }, [classId]);

  const handleStartClass = useCallback(async () => {
    if (!classId) return;
    setStartingClass(true);
    try {
      await api.post(`/classes/${classId}/start`);
      toast.success("Class started");
      await fetchClass();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to start class");
    } finally {
      setStartingClass(false);
    }
  }, [classId, fetchClass]);

  // ──────────────────────────────────────────
  // 6. Recording — upload to UploadThing, then attach metadata
  // ──────────────────────────────────────────
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const teardownRecordingPipeline = useCallback(() => {
    if (recordingRafRef.current != null) {
      cancelAnimationFrame(recordingRafRef.current);
      recordingRafRef.current = null;
    }
    recordingAudioClonesRef.current.forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    recordingAudioClonesRef.current = [];
    if (recordingVideoRef.current) {
      recordingVideoRef.current.pause();
      recordingVideoRef.current.srcObject = null;
      recordingVideoRef.current = null;
    }
    recordingCanvasRef.current = null;
    recordingMixStreamRef.current = null;
  }, []);

  /**
   * Build a canvas + mic mix once. Video source can switch between camera
   * and screen share without restarting MediaRecorder (which otherwise
   * keeps recording only the tracks it was given at start).
   */
  const buildRecordingStream = useCallback((): MediaStream | null => {
    const cam = localStreamRef.current;
    if (!cam && !screenStreamRef.current) return null;

    const canvas =
      recordingCanvasRef.current ?? document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    recordingCanvasRef.current = canvas;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;

    let video = recordingVideoRef.current;
    if (!video) {
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      recordingVideoRef.current = video;
    }

    const screen = screenStreamRef.current;
    const source =
      screen && screen.getVideoTracks().some((t) => t.readyState === "live")
        ? screen
        : cam;
    if (!source) return null;
    video.srcObject = source;
    void video.play().catch(() => {});

    if (recordingRafRef.current == null) {
      const draw = () => {
        const v = recordingVideoRef.current;
        const c = recordingCanvasRef.current;
        const context = c?.getContext("2d", { alpha: false });
        if (v && c && context) {
          context.fillStyle = "#0f172a";
          context.fillRect(0, 0, c.width, c.height);
          if (v.readyState >= 2 && v.videoWidth > 0) {
            const scale = Math.min(
              c.width / v.videoWidth,
              c.height / v.videoHeight,
            );
            const dw = v.videoWidth * scale;
            const dh = v.videoHeight * scale;
            const dx = (c.width - dw) / 2;
            const dy = (c.height - dh) / 2;
            context.drawImage(v, dx, dy, dw, dh);
          }
        }
        recordingRafRef.current = requestAnimationFrame(draw);
      };
      recordingRafRef.current = requestAnimationFrame(draw);
    }

    const canvasStream = canvas.captureStream(30);
    const mixed = new MediaStream();
    canvasStream.getVideoTracks().forEach((t) => mixed.addTrack(t));

    // Mic (always) + optional display audio, cloned so mute doesn't silence
    // the recording and so we can stop clones on teardown.
    recordingAudioClonesRef.current.forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    recordingAudioClonesRef.current = [];

    const addAudioFrom = (stream: MediaStream | null | undefined) => {
      stream?.getAudioTracks().forEach((t) => {
        if (t.readyState !== "live") return;
        try {
          const clone = t.clone();
          clone.enabled = true;
          mixed.addTrack(clone);
          recordingAudioClonesRef.current.push(clone);
        } catch {
          mixed.addTrack(t);
        }
      });
    };
    addAudioFrom(cam);
    addAudioFrom(screen);

    recordingMixStreamRef.current = mixed;
    return mixed;
  }, []);

  const uploadRecording = useCallback(
    async (chunks: Blob[], headerMime: string): Promise<boolean> => {
      stopRecordingTimer();
      setIsRecording(false);
      setIsUploadingRecording(true);
      setUploadProgress(0);

      try {
        const blob = new Blob(chunks, { type: headerMime });

        if (blob.size === 0) {
          toast.error("Recording contained no data. Try recording for longer.");
          return false;
        }

        if (blob.size > MAX_RECORDING_BYTES) {
          toast.error(
            `Recording exceeds the ${Math.round(
              MAX_RECORDING_BYTES / 1024 / 1024,
            )}MB limit`,
          );
          return false;
        }

        console.info(
          `[recording] uploading ${(blob.size / 1024 / 1024).toFixed(
            2,
          )}MB via API as ${headerMime}`,
        );

        const extension = headerMime.split("/")[1] || "webm";
        const filename = `class-${classId}-${Date.now()}.${extension}`;
        const base =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const durationSeconds = recordingSecondsRef.current;
        const startedAt = recordingStartedAtRef.current;

        // Use XHR so the default JSON Content-Type never overrides the body.
        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${base}/classes/${classId}/recording/upload`);
          xhr.withCredentials = true;
          xhr.timeout = 180000;
          xhr.setRequestHeader("Content-Type", headerMime);
          xhr.setRequestHeader("X-File-Name", filename);
          if (durationSeconds > 0) {
            xhr.setRequestHeader(
              "X-Recording-Duration",
              String(durationSeconds),
            );
          }
          if (startedAt) {
            xhr.setRequestHeader("X-Recording-Started-At", startedAt);
          }
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            setUploadProgress(
              Math.max(
                0,
                Math.min(99, Math.round((event.loaded / event.total) * 100)),
              ),
            );
          };
          xhr.onload = () => {
            resolve(
              new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
              }),
            );
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.ontimeout = () => reject(new Error("Upload timed out"));
          xhr.send(blob);
        });

        if (!response.ok) {
          let message = "Failed to upload recording. Please try again.";
          try {
            const payload = (await response.json()) as { message?: string };
            if (payload.message) message = payload.message;
          } catch {
            /* ignore parse errors */
          }
          toast.error(message);
          return false;
        }

        setUploadProgress(100);
        toast.success("Recording saved — find it in Recordings");
        return true;
      } catch (error: unknown) {
        console.error("[recording] upload failed:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to upload recording. Please try again.",
        );
        return false;
      } finally {
        setIsUploadingRecording(false);
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        recordingStartedAtRef.current = null;
        setUploadProgress(0);
        recordingChunksRef.current = [];
        recordingHeaderMimeRef.current = "application/octet-stream";
        teardownRecordingPipeline();
      }
    },
    [classId, stopRecordingTimer, teardownRecordingPipeline],
  );

  const startRecording = useCallback(() => {
    if (typeof MediaRecorder === "undefined") {
      toast.error("Your browser doesn't support in-browser recording");
      return;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      return;
    }
    const stream = buildRecordingStream();
    if (!stream || stream.getTracks().length === 0) {
      toast.error("Camera/microphone is not available to record");
      return;
    }

    // Ensure the live mic is on for teaching (recording uses enabled clones).
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    setIsMuted(false);
    syncRecordingVideoSource();

    const { recorderMime, headerMime } = pickRecordingMimeType();
    recordingHeaderMimeRef.current = headerMime;

    try {
      const recorder = new MediaRecorder(stream, {
        ...(recorderMime ? { mimeType: recorderMime } : {}),
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      });

      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunks = recordingChunksRef.current.slice();
        void uploadRecording(chunks, recordingHeaderMimeRef.current).then(
          (ok) => {
            uploadResolveRef.current?.(ok);
            uploadResolveRef.current = null;
          },
        );
      };

      recorder.onerror = () => {
        toast.error("Recording stopped due to an error");
        stopRecordingTimer();
        setIsRecording(false);
        recordingChunksRef.current = [];
        teardownRecordingPipeline();
        uploadResolveRef.current?.(false);
        uploadResolveRef.current = null;
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingStartedAtRef.current = new Date().toISOString();
      toast.success(
        screenStreamRef.current
          ? "Recording screen + microphone"
          : "Recording started — screen share will be included when you share",
      );

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => {
          const next = s + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error("[recording] failed to start:", error);
      teardownRecordingPipeline();
      toast.error("Failed to start recording on this device");
    }
  }, [
    stopRecordingTimer,
    uploadRecording,
    buildRecordingStream,
    syncRecordingVideoSource,
    teardownRecordingPipeline,
  ]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    try {
      if (recorder.state === "recording") {
        recorder.requestData();
      }
    } catch (error) {
      console.warn("[recording] requestData threw (harmless):", error);
    }

    try {
      recorder.stop();
    } catch (error) {
      console.error("[recording] stop() failed:", error);
      stopRecordingTimer();
      setIsRecording(false);
    }
  }, [stopRecordingTimer]);

  const stopRecordingAndWait = useCallback(async (): Promise<boolean> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return !isUploadingRecording;
    }

    return new Promise<boolean>((resolve) => {
      uploadResolveRef.current = resolve;
      stopRecording();
      // Safety timeout so leave/end never hangs forever
      window.setTimeout(() => {
        if (uploadResolveRef.current === resolve) {
          uploadResolveRef.current = null;
          resolve(false);
        }
      }, 180000);
    });
  }, [stopRecording, isUploadingRecording]);

  const toggleRecording = useCallback(() => {
    if (isUploadingRecording || endingClass) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [
    isRecording,
    isUploadingRecording,
    endingClass,
    startRecording,
    stopRecording,
  ]);

  // Auto-start recording for recordable classes once the host has media.
  useEffect(() => {
    if (state.kind !== "ready") return;
    if (state.liveClass.status !== "live") return;
    if (!state.liveClass.isRecordable) return;
    if (!localStream) return;
    if (autoRecordStartedRef.current || isRecording || isUploadingRecording) {
      return;
    }
    const isHostUser =
      user?.role === "admin" ||
      state.liveClass.tutor?._id === user?._id;
    if (!isHostUser) return;

    autoRecordStartedRef.current = true;
    const timer = window.setTimeout(() => {
      startRecording();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    state,
    localStream,
    isRecording,
    isUploadingRecording,
    user?.role,
    user?._id,
    startRecording,
  ]);

  const navigateAfterClass = useCallback(() => {
    if (user?.role === "tutor" || user?.role === "admin") {
      navigate("/tutor/classes");
    } else {
      navigate("/live-classes");
    }
  }, [navigate, user?.role]);

  const handleEndClass = useCallback(async () => {
    if (!classId || endingClass) return;

    stayForUploadRef.current = true;
    setEndingClass(true);
    try {
      // Upload the recording BEFORE ending the room so the file is attached
      // and students can find it under Recordings.
      if (isRecording) {
        toast.message("Saving recording before ending class…");
        await stopRecordingAndWait();
      } else if (isUploadingRecording) {
        toast.message("Finishing recording upload…");
        await new Promise<boolean>((resolve) => {
          const previous = uploadResolveRef.current;
          uploadResolveRef.current = (ok) => {
            previous?.(ok);
            resolve(ok);
          };
          window.setTimeout(() => {
            if (uploadResolveRef.current) {
              uploadResolveRef.current = previous;
              resolve(false);
            }
          }, 180000);
        });
      }

      await api.post(`/classes/${classId}/end`);

      const sessionIdRaw =
        state.kind === "ready" ? state.liveClass.sessionId || classId : classId;
      const sessionId =
        typeof sessionIdRaw === "string"
          ? sessionIdRaw
          : String(sessionIdRaw);
      socketRef.current?.emit("class-ended", { sessionId });
      socketRef.current?.emit("leave-class", { sessionId });

      toast.success("Class ended for everyone");
      navigateAfterClass();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to end class");
      stayForUploadRef.current = false;
    } finally {
      setEndingClass(false);
    }
  }, [
    classId,
    endingClass,
    isRecording,
    isUploadingRecording,
    stopRecordingAndWait,
    navigateAfterClass,
    state,
  ]);

  const leaveClass = useCallback(async () => {
    if (leavingRef.current || endingClass) return;

    // Host leave = end class (cannot leave a live room open)
    const isHost =
      state.kind === "ready" &&
      (user?.role === "admin" || state.liveClass.tutor?._id === user?._id);

    if (isHost && state.kind === "ready" && state.liveClass.status === "live") {
      await handleEndClass();
      return;
    }

    leavingRef.current = true;
    try {
      if (isRecording) {
        toast.message("Stopping recording before you leave…");
        await stopRecordingAndWait();
      }

      const sessionIdRaw =
        state.kind === "ready" ? state.liveClass.sessionId || classId : classId;
      const sessionId =
        typeof sessionIdRaw === "string"
          ? sessionIdRaw
          : String(sessionIdRaw);
      socketRef.current?.emit("leave-class", { sessionId });
      navigateAfterClass();
    } finally {
      leavingRef.current = false;
    }
  }, [
    classId,
    endingClass,
    isRecording,
    stopRecordingAndWait,
    navigateAfterClass,
    state,
    user,
    handleEndClass,
  ]);

  // ──────────────────────────────────────────
  // 7. Video participants
  // ──────────────────────────────────────────
  const videoParticipants: VideoParticipant[] = useMemo(() => {
    const list: VideoParticipant[] = [
      {
        userId: user?._id || "local",
        userName: user?.name || "You",
        userAvatar: user?.avatar,
        stream: localStream,
        isMuted,
        isVideoOn,
        isScreenSharing,
        isSpeaking: false,
      },
    ];
    for (const p of participants) {
      list.push({
        userId: p.userId,
        userName: p.userName,
        userAvatar: p.userAvatar,
        stream: null,
        isMuted: p.isMuted,
        isVideoOn: p.isVideoOn,
        isScreenSharing: p.isScreenSharing,
        isSpeaking: false,
      });
    }
    return list;
  }, [user, localStream, isMuted, isVideoOn, isScreenSharing, participants]);

  // ──────────────────────────────────────────
  // 8. Non-live states
  // ──────────────────────────────────────────

  if (state.kind === "loading") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading the classroom…</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={leaveClass}
          className="mt-2 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center bg-background">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
          <Video className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">
            Unable to open the classroom
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {state.message}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={leaveClass}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
          <Button size="sm" onClick={() => void fetchClass()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const cls = state.liveClass;

  if (availability?.kind === "future") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center bg-background">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{cls.title}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            This class is scheduled for{" "}
            <strong className="text-foreground">
              {formatScheduled(cls.scheduledDate)}
            </strong>
            . You'll be able to start and enter once that time arrives.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {cls.category?.name}
        </div>
        <Button variant="outline" size="sm" onClick={leaveClass}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to classes
        </Button>
      </div>
    );
  }

  if (availability?.kind === "readyToStart") {
    const isOwner = user?.role === "admin" || cls.tutor?._id === user?._id;
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center bg-background">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Video className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{cls.title}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {isOwner
              ? "This class is ready to start."
              : "Waiting for the tutor to start this class."}
          </p>
        </div>
        {isOwner ? (
          <Button
            onClick={handleStartClass}
            disabled={startingClass}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
          >
            {startingClass ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Start Class
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={leaveClass}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
        )}
      </div>
    );
  }

  if (availability?.kind === "unavailable") {
    const ended =
      availability.status === "ended" ||
      availability.status === "processing" ||
      availability.status === "recorded";
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center bg-[#F7F8FB]">
        <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center">
          <Video className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">{cls.title}</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {ended
              ? "This class has ended and can no longer be entered."
              : `This class is not available right now (status: ${availability.status}).`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void leaveClass()}
          className="rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to classes
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // 9. Live classroom
  // ──────────────────────────────────────────
  const isTutorOfThisClass = cls.tutor?._id === user?._id;
  const canRecord =
    !!cls.isRecordable &&
    !!localStream &&
    (isTutorOfThisClass || user?.role === "admin");
  const firstName = user?.name?.split(" ")[0] || "there";

  const controls = (
    <ClassControls
      overlay
      isMuted={isMuted}
      isVideoOn={isVideoOn}
      isScreenSharing={isScreenSharing}
      isHandRaised={isHandRaised}
      isChatOpen={isChatOpen}
      isParticipantListOpen={isParticipantListOpen}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
      onToggleScreenShare={toggleScreenShare}
      onToggleHandRaise={toggleHandRaise}
      onToggleChat={() => setIsChatOpen((v) => !v)}
      onToggleParticipantList={() => setIsParticipantListOpen((v) => !v)}
      onLeaveClass={() => void leaveClass()}
      participantCount={participants.length}
      canRecord={canRecord}
      isRecording={isRecording}
      isUploadingRecording={isUploadingRecording}
      recordingSeconds={recordingSeconds}
      uploadProgress={uploadProgress}
      onToggleRecording={toggleRecording}
      isHost={isTutorOfThisClass || user?.role === "admin"}
      isEndingClass={endingClass}
      onEndClass={() => void handleEndClass()}
    />
  );

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#F7F8FB] text-slate-900 overflow-hidden">
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold text-slate-800">
            Hi, {firstName}! 👋
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <h1 className="text-sm sm:text-lg font-black text-slate-900 truncate">
              {cls.title}
            </h1>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Live now
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {cls.category?.name || "GYGI"}
            {cls.tutor?.name ? ` · ${cls.tutor.name}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-sm">
            <Users className="w-3.5 h-3.5 text-primary" />
            {participants.length + 1} in class
          </span>
          {isRecording && (
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-rose-50 border border-rose-100 text-[11px] font-bold text-rose-600">
              <Radio className="w-3.5 h-3.5" />
              Recording
            </span>
          )}
        </div>
      </header>

      {mediaError && (
        <div className="mx-4 sm:mx-6 mb-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
          {mediaError}
        </div>
      )}

      <div className="relative z-10 flex flex-1 gap-4 px-4 sm:px-6 pb-4 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <VideoGrid
            participants={videoParticipants}
            currentUserId={user?._id}
            classTitle={cls.title}
            controlsSlot={controls}
          />

          {/* Class insights strip */}
          <div className="mt-4 hidden md:grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Live session
                </p>
                <p className="text-[11px] text-slate-400">
                  {cls.category?.name || "GYGI class"} ·{" "}
                  {participants.length + 1} joined
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <CircleDot className="w-4 h-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Recording ready
                </p>
                <p className="text-[11px] text-slate-400">
                  {canRecord
                    ? isRecording
                      ? "Capturing this session"
                      : "Tap record when you're ready"
                    : "Host controls recording"}
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full bg-violet-500 transition-all",
                      isRecording ? "w-3/4" : "w-1/4",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ChatPanel
          dock
          socket={socket}
          sessionId={cls.sessionId || classId || ""}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />

        <ParticipantList
          participants={participants}
          isOpen={isParticipantListOpen}
          onClose={() => setIsParticipantListOpen(false)}
          currentUserId={user?._id}
          isHost={isTutorOfThisClass || user?.role === "admin"}
        />
      </div>

      {isScreenSharing && screenStream && (
        <ScreenShare
          stream={screenStream}
          isSharing={isScreenSharing}
          onStopSharing={toggleScreenShare}
          className="absolute inset-0 z-40"
        />
      )}

      {(isUploadingRecording || endingClass) && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-[1.5rem] bg-white border border-slate-200 p-6 shadow-2xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900">
              {endingClass ? "Ending class…" : "Uploading recording…"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please keep this tab open until it finishes.
            </p>
            {isUploadingRecording && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(4, uploadProgress)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500 tabular-nums">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeQuiz && (
        <LiveQuizPopup
          quizId={activeQuiz.quizId}
          question={activeQuiz.question}
          timeLeft={activeQuiz.timeLeft || 30}
          totalQuestions={activeQuiz.totalQuestions || 1}
          currentQuestionIndex={activeQuiz.currentQuestionIndex || 0}
          onAnswer={(questionId, answer) => {
            socketRef.current?.emit("submit-quiz-answer", {
              sessionId: classId,
              quizId: activeQuiz.quizId,
              questionId,
              answer,
            });
          }}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {activePoll && (
        <PollPopup
          pollId={activePoll.pollId}
          question={activePoll.question}
          options={activePoll.options || []}
          totalVotes={activePoll.totalVotes || 0}
          hasVoted={activePoll.hasVoted || false}
          onVote={(pollId, optionId) => {
            socketRef.current?.emit("respond-poll", {
              sessionId: classId,
              pollId,
              optionIndex: optionId,
            });
          }}
          onClose={() => setActivePoll(null)}
          isHost={isTutorOfThisClass || user?.role === "admin"}
        />
      )}
    </div>
  );
};

export default LiveClassroom;
