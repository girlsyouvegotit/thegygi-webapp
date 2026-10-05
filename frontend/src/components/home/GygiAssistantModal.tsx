import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Mic,
  MicOff,
  Monitor,
  Moon,
  Send,
  Sun,
  User,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { canonicalizeGygiQuestion } from "@/lib/gygiSpeech";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  createdAt: number;
}

const MESSAGE_TTL_MS = 30_000;

type AssistantTheme = "light" | "dark" | "system";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const THEME_STORAGE_KEY = "gygi-assistant-theme";

const getSpeechRecognition = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

/** Prefer a Nigerian / West African English female TTS voice when the browser has one. */
const pickNigerianFemaleVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const femaleHint =
    /female|woman|girl|samantha|karen|moira|tessa|fiona|victoria|zira|susan|hazel|serena|google uk english female|microsoft aria|microsoft jenny|microsoft sona|microsoft joy/i;
  const maleHint = /male|man|david|daniel|mark|george|thomas|james|ravi|fred/i;

  const score = (voice: SpeechSynthesisVoice) => {
    const hay = `${voice.name} ${voice.lang}`.toLowerCase();
    let s = 0;
    if (/en-?ng|nigeria/.test(hay)) s += 100;
    if (/en-?gh|ghana|en-?za|africa|west african/.test(hay)) s += 40;
    if (voice.lang.toLowerCase().startsWith("en")) s += 10;
    if (femaleHint.test(hay)) s += 30;
    if (maleHint.test(hay)) s -= 50;
    // Slight preference for local/native voices when quality is similar
    if (voice.localService) s += 2;
    return s;
  };

  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
};

const speakAsGygiAssistant = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const speak = () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-NG";
    utter.rate = 0.96;
    utter.pitch = 1.08;
    const voice = pickNigerianFemaleVoice();
    if (voice) {
      utter.voice = voice;
      // Keep en-NG when the chosen voice supports it; otherwise use the voice locale.
      if (/en/i.test(voice.lang)) utter.lang = voice.lang || "en-NG";
    }
    window.speechSynthesis.speak(utter);
  };

  // Chrome loads voices asynchronously
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    speak();
    return;
  }

  const onVoices = () => {
    window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    speak();
  };
  window.speechSynthesis.addEventListener("voiceschanged", onVoices);
  // Fallback if voiceschanged never fires
  window.setTimeout(() => {
    window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    speak();
  }, 250);
};

const WELCOME_TEXT =
  "Hello! I'm the GYGI assistant. Ask me anything about GYGI — programs, mentorship, live classes, certificates, alumni support, or how to get started. Tap the mic to speak.";

const makeWelcomeMessage = (): ChatMessage => ({
  id: Date.now(),
  sender: "bot",
  text: WELCOME_TEXT,
  timestamp: "Just now",
  createdAt: Date.now(),
});

function usePrefersDark() {
  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return prefersDark;
}

function ParticleOrb({
  listening,
  thinking,
  isDark,
  size = 200,
}: {
  listening: boolean;
  thinking: boolean;
  isDark: boolean;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const modeRef = useRef({ listening, thinking, isDark });

  useEffect(() => {
    modeRef.current = { listening, thinking, isDark };
  }, [listening, thinking, isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: Array<{
      theta: number;
      phi: number;
      r: number;
      speed: number;
      size: number;
    }> = [];

    const baseR = size * 0.28;
    const spread = size * 0.1;
    const count = size < 180 ? 280 : 420;

    for (let i = 0; i < count; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: baseR + Math.random() * spread,
        speed: 0.002 + Math.random() * 0.006,
        size: 0.7 + Math.random() * 1.4,
      });
    }

    const draw = () => {
      const {
        listening: isListening,
        thinking: isThinking,
        isDark: dark,
      } = modeRef.current;
      tRef.current += isListening ? 0.028 : isThinking ? 0.02 : 0.012;
      const t = tRef.current;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const pulse = isListening
        ? 1.08 + Math.sin(t * 4) * 0.04
        : isThinking
          ? 1.04
          : 1;

      const glow = ctx.createRadialGradient(cx, cy, size * 0.07, cx, cy, size * 0.5);
      if (dark) {
        glow.addColorStop(0, "rgba(193, 71, 233, 0.35)");
        glow.addColorStop(0.45, "rgba(168, 85, 247, 0.16)");
        glow.addColorStop(1, "rgba(193, 71, 233, 0)");
      } else {
        glow.addColorStop(0, "rgba(193, 71, 233, 0.28)");
        glow.addColorStop(0.5, "rgba(216, 180, 254, 0.2)");
        glow.addColorStop(1, "rgba(193, 71, 233, 0)");
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      for (const p of particles) {
        p.theta += p.speed * (isListening ? 2.2 : isThinking ? 1.6 : 1);
        const wave =
          Math.sin(p.theta * 3 + t * 2) *
            (isListening ? size * 0.035 : isThinking ? size * 0.025 : size * 0.014) +
          Math.cos(p.phi * 4 + t) * (isListening ? size * 0.02 : size * 0.01);
        const radius = (p.r + wave) * pulse;
        const x = cx + radius * Math.sin(p.phi) * Math.cos(p.theta);
        const y = cy + radius * Math.sin(p.phi) * Math.sin(p.theta) * 0.92;
        const z = Math.cos(p.phi);
        const alpha = dark
          ? 0.25 + (z + 1) * 0.35
          : 0.35 + (z + 1) * 0.3;
        ctx.fillStyle = dark
          ? `rgba(232, 180, 255, ${alpha})`
          : `rgba(168, 85, 247, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.7 + (z + 1) * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
      <div
        className={cn(
          "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 sm:h-12 sm:w-12",
          isDark
            ? "border-white/20 bg-white/10"
            : "border-primary/25 bg-white/80 shadow-md",
          listening &&
            "scale-110 border-primary/60 bg-primary/25 shadow-[0_0_30px_rgba(193,71,233,0.55)]",
          thinking && "animate-pulse",
        )}
      >
        {thinking && !listening ? (
          <Bot className={cn("h-5 w-5", isDark ? "text-white" : "text-primary")} />
        ) : (
          <Mic className={cn("h-5 w-5", isDark ? "text-white" : "text-primary")} />
        )}
      </div>
    </div>
  );
}

interface GygiAssistantModalProps {
  open: boolean;
  onClose: () => void;
}

const GygiAssistantModal = ({ open, onClose }: GygiAssistantModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    makeWelcomeMessage(),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceHint, setVoiceHint] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [themeChoice, setThemeChoice] = useState<AssistantTheme>("system");
  const [orbSize, setOrbSize] = useState(200);

  const prefersDark = usePrefersDark();
  const isDark =
    themeChoice === "dark" || (themeChoice === "system" && prefersDark);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef(messages);
  const typingRef = useRef(isTyping);
  const liveTranscriptRef = useRef("");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    typingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AssistantTheme | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeChoice(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeChoice);
    } catch {
      // ignore
    }
  }, [themeChoice]);

  useEffect(() => {
    if (!open) return;
    setVoiceSupported(!!getSpeechRecognition());

    // Warm TTS voice list so Nigerian/female selection is ready on first reply.
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const warm = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", warm);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", warm);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updateOrb = () => {
      const w = window.innerWidth;
      if (w < 380) setOrbSize(140);
      else if (w < 640) setOrbSize(160);
      else setOrbSize(220);
    };
    updateOrb();
    window.addEventListener("resize", updateOrb);
    return () => window.removeEventListener("resize", updateOrb);
  }, [open]);

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.abort();
      setListening(false);
      abortRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Fresh welcome each time the modal opens.
    setMessages([makeWelcomeMessage()]);
    setShowTranscript(false);
  }, [open]);

  // Auto-delete messages after 30 seconds.
  useEffect(() => {
    if (!open) return;

    const tick = () => {
      const now = Date.now();
      setMessages((prev) => {
        const kept = prev.filter((m) => now - m.createdAt < MESSAGE_TTL_MS);
        if (kept.length === prev.length) return prev;
        if (kept.length === 0) return [makeWelcomeMessage()];
        return kept;
      });
    };

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current && showTranscript) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, showTranscript]);

  const statusLabel = useMemo(() => {
    if (listening) return "Listening… speak now";
    if (isTyping) return "GYGI is thinking…";
    if (voiceHint) return voiceHint;
    return "Online · voice & text";
  }, [listening, isTyping, voiceHint]);

  const sendMessage = useCallback(async (rawText: string) => {
    const userText = canonicalizeGygiQuestion(rawText);
    if (!userText || typingRef.current) return;

    const now = Date.now();
    const newMessage: ChatMessage = {
      id: messageIdRef.current++,
      sender: "user",
      text: userText,
      timestamp: "Just now",
      createdAt: now,
    };

    const history = [...messagesRef.current, newMessage]
      .filter((m) => m.text !== WELCOME_TEXT)
      .slice(-10)
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.text,
      }));

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setShowTranscript(true);
    setIsTyping(true);
    setVoiceHint("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data } = await api.post(
        "/public/chatbot",
        { message: userText, history },
        { signal: controller.signal },
      );

      const reply =
        (data?.data?.reply as string | undefined)?.trim() ||
        "I can help with anything about GYGI. Try asking about programs, mentorship, or how to join.";

      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          sender: "bot",
          text: reply,
          timestamp: "Just now",
          createdAt: Date.now(),
        },
      ]);

      try {
        speakAsGygiAssistant(reply);
      } catch {
        // optional
      }
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ERR_CANCELED"
      ) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          sender: "bot",
          text: "I couldn't reach the GYGI assistant just now. Please try again, or email girlsyougotit25@gmail.com / call +234 906 495 0175.",
          timestamp: "Just now",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceSupported(false);
      setVoiceHint("Voice isn’t supported in this browser — type instead.");
      return;
    }
    if (isTyping) return;

    try {
      recognitionRef.current?.abort();
      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-NG";
      recognitionRef.current = recognition;

      liveTranscriptRef.current = "";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i]![0]!.transcript;
          if (event.results[i]!.isFinal) finalTranscript += piece;
          else interim += piece;
        }
        const live = (finalTranscript || interim).trim();
        liveTranscriptRef.current = live;
        if (live) setInputValue(live);
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === "not-allowed") {
          setVoiceHint("Microphone permission blocked. Enable it to use voice.");
        } else if (event.error !== "aborted") {
          setVoiceHint("Couldn’t capture voice. Try again or type your question.");
        }
      };

      recognition.onend = () => {
        setListening(false);
        const text = liveTranscriptRef.current.trim();
        if (text) {
          void sendMessage(text);
        }
      };

      recognition.start();
      setListening(true);
      setVoiceHint("");
      setShowTranscript(true);
    } catch {
      setListening(false);
      setVoiceHint("Voice start failed. You can still type below.");
    }
  }, [isTyping, sendMessage]);

  const toggleVoice = () => {
    if (listening) stopListening();
    else startListening();
  };

  if (!open) return null;

  const themeOptions: Array<{
    id: AssistantTheme;
    label: string;
    icon: typeof Sun;
  }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-md",
          isDark ? "bg-[#05020a]/75" : "bg-slate-900/40",
        )}
      />

      <div
        className={cn(
          "relative flex w-full max-w-xl flex-col overflow-hidden rounded-[24px] animate-bounce-in sm:max-w-2xl sm:rounded-[28px]",
          "max-h-[min(640px,78vh)] sm:max-h-[min(720px,85vh)]",
          isDark
            ? "border border-white/10 shadow-[0_30px_120px_rgba(193,71,233,0.25)]"
            : "border border-primary/15 shadow-[0_24px_80px_rgba(15,23,42,0.18)]",
        )}
        style={{
          background: isDark
            ? "radial-gradient(120% 80% at 50% 0%, #1a0b24 0%, #09060f 45%, #050208 100%)"
            : "radial-gradient(120% 80% at 50% 0%, #faf5ff 0%, #f8fafc 48%, #ffffff 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64"
          style={{
            background: isDark
              ? "rgba(193,71,233,0.35)"
              : "rgba(193,71,233,0.18)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-8 h-52 w-52 rounded-full blur-3xl sm:h-72 sm:w-72"
          style={{
            background: isDark
              ? "rgba(124,58,237,0.28)"
              : "rgba(216,180,254,0.45)",
          }}
        />

        {/* Top bar */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3",
            isDark ? "border-white/5" : "border-slate-200/80",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-sm font-semibold",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                GYGI AI
              </p>
              <p
                className={cn(
                  "truncate text-[10px]",
                  isDark ? "text-white/50" : "text-slate-500",
                )}
              >
                {statusLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex items-center rounded-full p-0.5",
                isDark ? "bg-white/5" : "bg-slate-100",
              )}
              role="group"
              aria-label="Assistant theme"
            >
              {themeOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setThemeChoice(id)}
                  title={label}
                  aria-label={`${label} theme`}
                  aria-pressed={themeChoice === id}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition sm:h-8 sm:w-8",
                    themeChoice === id
                      ? "bg-primary text-white shadow-sm"
                      : isDark
                        ? "text-white/55 hover:text-white"
                        : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <a
              href="/register"
              className="hidden rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(193,71,233,0.35)] transition hover:bg-primary/90 sm:inline-flex"
            >
              Join free
            </a>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition",
                isDark
                  ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
              )}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero voice stage — compact on mobile */}
        <div className="relative z-10 flex shrink-0 flex-col items-center px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-5">
          <h2
            className={cn(
              "max-w-lg text-center text-lg font-semibold tracking-tight sm:text-2xl",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            Talk to GYGI AI
          </h2>
          <p
            className={cn(
              "mt-1 max-w-md text-center text-[11px] leading-snug sm:mt-1.5 sm:text-sm",
              isDark ? "text-white/55" : "text-slate-500",
            )}
          >
            Programs, mentorship, classes, certificates — ask by voice or text.
          </p>

          <button
            type="button"
            onClick={toggleVoice}
            disabled={isTyping}
            className="mt-1 focus:outline-none sm:mt-2"
            aria-label={listening ? "Stop listening" : "Start voice question"}
          >
            <ParticleOrb
              listening={listening}
              thinking={isTyping}
              isDark={isDark}
              size={orbSize}
            />
          </button>

          <button
            type="button"
            onClick={toggleVoice}
            disabled={isTyping}
            className={cn(
              "mt-0.5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition-all duration-300 sm:mt-1 sm:px-6 sm:py-3 sm:text-sm",
              "bg-gradient-to-r from-primary to-[#a21caf] shadow-[0_0_24px_rgba(193,71,233,0.45)]",
              "hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              listening && "ring-2 ring-primary/40",
            )}
          >
            {listening ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop listening
              </>
            ) : (
              <>
                Speak with GYGI
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {!voiceSupported && (
            <p
              className={cn(
                "mt-1.5 text-center text-[11px]",
                isDark ? "text-amber-200/80" : "text-amber-700",
              )}
            >
              Voice isn’t available here — use the text field below.
            </p>
          )}
        </div>

        {/* Transcript + composer */}
        <div
          className={cn(
            "relative z-10 flex min-h-0 flex-col border-t px-3 pb-3 pt-2 sm:px-5 sm:pb-4",
            isDark ? "border-white/5 bg-black/25" : "border-slate-200/80 bg-white/55",
          )}
        >
          <div className="mb-1.5 flex items-center justify-between px-1 sm:mb-2">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className={cn(
                "text-[11px] font-medium transition",
                isDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {showTranscript ? "Hide conversation" : "Show conversation"}
            </button>
            <span
              className={cn(
                "text-[10px]",
                isDark ? "text-white/35" : "text-slate-400",
              )}
            >
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </span>
          </div>

          {showTranscript && (
            <div
              className={cn(
                "mb-2 max-h-[100px] space-y-2 overflow-y-auto rounded-2xl border p-2.5 sm:mb-3 sm:max-h-[160px] sm:space-y-2.5 sm:p-3",
                isDark
                  ? "border-white/5 bg-black/20"
                  : "border-slate-200 bg-white/80",
              )}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.sender === "bot" && (
                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/30">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed sm:px-3.5 sm:py-2.5 sm:text-sm",
                      message.sender === "user"
                        ? "rounded-br-sm bg-primary text-white shadow-[0_0_16px_rgba(193,71,233,0.35)]"
                        : isDark
                          ? "rounded-bl-sm border border-white/10 bg-white/5 text-white/90"
                          : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800",
                    )}
                  >
                    <p>{message.text}</p>
                  </div>
                  {message.sender === "user" && (
                    <div
                      className={cn(
                        "ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        isDark ? "bg-white/10" : "bg-slate-200",
                      )}
                    >
                      <User
                        className={cn(
                          "h-3.5 w-3.5",
                          isDark ? "text-white/70" : "text-slate-600",
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/30">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl rounded-bl-sm border px-4 py-3",
                      isDark
                        ? "border-white/10 bg-white/5"
                        : "border-slate-200 bg-slate-50",
                    )}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 rounded-full border p-1.5 pl-2 backdrop-blur-md",
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-200 bg-white shadow-sm",
            )}
          >
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isTyping}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                listening
                  ? "bg-primary text-white shadow-[0_0_18px_rgba(193,71,233,0.55)]"
                  : isDark
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                "disabled:opacity-50",
              )}
              aria-label={listening ? "Stop voice note" : "Record voice note"}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage(inputValue);
              }}
              placeholder={
                listening
                  ? "Listening…"
                  : "Type or use a voice note about GYGI…"
              }
              className={cn(
                "min-w-0 flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none",
                isDark
                  ? "text-white placeholder:text-white/35"
                  : "text-slate-900 placeholder:text-slate-400",
              )}
              aria-label="Ask GYGI AI"
            />
            <button
              type="button"
              onClick={() => void sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default GygiAssistantModal;
