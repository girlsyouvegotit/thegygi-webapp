import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  ChevronDown,
  Users,
  Zap,
  Trophy,
  Leaf,
  Radio,
  MessageCircle,
  Video,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

type ActivityTone = "green" | "amber" | "peak";

interface PulseData {
  activeNow: number;
  socketOnline: number;
  recentlyActive: number;
  liveClassParticipants: number;
  liveClasses: number;
  totalStudents: number;
  mentorMatchRate: number;
  categories: { _id: string; name: string }[];
  onlineAvatars: { _id: string; name: string; avatar: string | null }[];
  topMentors: {
    _id: string;
    name: string;
    avatar: string | null;
    role: string;
    menteeCount: number;
  }[];
  channels: { name: string; type: string; activity: number }[];
  activity: {
    hour: number;
    count: number;
    height: number;
    tone: ActivityTone;
  }[];
  peakHourLabel: string;
  updatedAt: string;
}

const channelIcon = (type: string) => {
  if (type === "learning" || type === "live-help") return Video;
  if (type === "mentorship") return Users;
  return MessageCircle;
};

const barColor = (tone: ActivityTone) => {
  if (tone === "green") return "bg-emerald-400";
  if (tone === "amber") return "bg-amber-400";
  return "bg-primary";
};

const formatMentees = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const MOCK_ACTIVITY: PulseData["activity"] = [
  28, 18, 22, 35, 42, 38, 55, 62, 70, 78, 85, 92, 100, 88, 75, 68, 80, 95, 72,
  58, 48, 40, 32, 25,
].map((height, hour) => {
  const count = Math.round(height * 1.8);
  let tone: ActivityTone = "green";
  if (height >= 85) tone = "peak";
  else if (height >= 50) tone = "amber";
  return { hour, count, height, tone };
});

const MOCK_PULSE: PulseData = {
  activeNow: 1842,
  socketOnline: 0,
  recentlyActive: 1842,
  liveClassParticipants: 0,
  liveClasses: 3,
  totalStudents: 50000,
  mentorMatchRate: 72,
  categories: [
    { _id: "mock-web", name: "Web Development" },
    { _id: "mock-uiux", name: "UI/UX" },
    { _id: "mock-data", name: "Data Science" },
  ],
  onlineAvatars: [
    { _id: "1", name: "Adaeze", avatar: "/frontend.jpg" },
    { _id: "2", name: "Kofo", avatar: "/Kofo.jpg" },
    { _id: "3", name: "Daniel", avatar: "/daniel.jpg" },
    { _id: "4", name: "Joy", avatar: "/joy.jpg" },
    { _id: "5", name: "Teniade", avatar: "/CEO.jpg" },
    { _id: "6", name: "Amara", avatar: "/career1.jpg" },
  ],
  topMentors: [
    {
      _id: "m1",
      name: "Adaeze",
      avatar: "/frontend.jpg",
      role: "Web Development",
      menteeCount: 24,
    },
    {
      _id: "m2",
      name: "Kofo",
      avatar: "/Kofo.jpg",
      role: "UI/UX",
      menteeCount: 18,
    },
    {
      _id: "m3",
      name: "Daniel",
      avatar: "/daniel.jpg",
      role: "Data Science",
      menteeCount: 15,
    },
  ],
  channels: [
    { name: "general", type: "general", activity: 128 },
    { name: "learning", type: "learning", activity: 46 },
    { name: "mentorship", type: "mentorship", activity: 32 },
  ],
  activity: MOCK_ACTIVITY,
  peakHourLabel: "12 PM WAT",
  updatedAt: new Date().toISOString(),
};

const POLL_MS = 12_000;

const CommunityDriven = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string>("");
  const [openFilter, setOpenFilter] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState<PulseData>(MOCK_PULSE);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const fetchPulse = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const { data } = await api.get("/public/community-pulse", {
        params: categoryId ? { categoryId } : undefined,
      });
      if (data?.success && data?.data?.pulse) {
        setPulse(data.data.pulse as PulseData);
        setIsLive(true);
      } else {
        setPulse(MOCK_PULSE);
        setIsLive(false);
      }
    } catch {
      setPulse(MOCK_PULSE);
      setIsLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    void fetchPulse();
    const id = setInterval(() => void fetchPulse(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchPulse]);

  const selectedCategoryName =
    pulse.categories.find((c) => c._id === categoryId)?.name || "All programs";

  return (
    <section
      id="community"
      className="relative overflow-hidden bg-transparent py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div
          className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 sm:mb-12 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/5 shadow-sm mb-4">
              <span className="relative flex h-2 w-2">
                {isLive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isLive ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-gray-600">
                {isLive ? "Live community pulse" : "Preview community pulse"}
              </span>
              {refreshing && isLive && (
                <RefreshCw className="w-3 h-3 text-primary animate-spin" />
              )}
            </div>
            <h2 className="text-3xl font-black leading-[1.05] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
              Community-driven
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Join live classes, connect with mentors, and learn with students
              across Africa — powered by real platform activity, updated live.
            </p>
          </div>
          <button
            onClick={() => navigate("/register")}
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/25"
          >
            Join the community
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-[1.75rem] bg-white p-16 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-500">
              Fetching community data…
            </p>
          </div>
        ) : (
          <div
            className={`space-y-4 sm:space-y-5 transition-all duration-1000 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {/* Active now */}
            <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/[0.03]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-500" fill="currentColor" />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenFilter((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:border-primary/30 hover:text-primary transition-colors bg-white"
                  >
                    {selectedCategoryName}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openFilter && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-gray-100 shadow-xl py-1.5 z-20 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryId("");
                          setOpenFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                          !categoryId
                            ? "text-primary bg-primary/5"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        All programs
                      </button>
                      {pulse.categories.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setCategoryId(c._id);
                            setOpenFilter(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                            categoryId === c._id
                              ? "text-primary bg-primary/5"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-foreground sm:text-2xl">
                Active now
              </h3>
              <p className="mt-1.5 text-sm text-gray-500 max-w-md">
                {pulse.liveClasses > 0 ? (
                  <>
                    <span className="font-bold text-amber-500">
                      {pulse.liveClasses}
                    </span>{" "}
                    live class{pulse.liveClasses === 1 ? "" : "es"} running ·{" "}
                  </>
                ) : null}
                <span className="font-bold text-amber-500">
                  {pulse.activeNow.toLocaleString()}
                </span>{" "}
                learners active across Africa
                {pulse.socketOnline > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-bold text-emerald-500">
                      {pulse.socketOnline}
                    </span>{" "}
                    connected now
                  </>
                ) : null}
              </p>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight leading-none text-foreground tabular-nums sm:text-6xl">
                    {pulse.activeNow.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-gray-400 mb-1.5">
                    online
                  </span>
                </div>

                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {pulse.onlineAvatars.slice(0, 6).map((u) => (
                      <img
                        key={u._id}
                        src={u.avatar || "/gygiLogo.jpg"}
                        alt={u.name}
                        title={u.name}
                        className="w-10 h-10 rounded-full object-cover border-[3px] border-white shadow-sm ring-2 ring-emerald-400/30 bg-gray-100"
                      />
                    ))}
                  </div>
                  {pulse.totalStudents > 6 && (
                    <div className="ml-2 w-10 h-10 rounded-full bg-indigo-950 text-white text-[10px] font-bold flex items-center justify-center border-[3px] border-white shadow-sm">
                      +
                      {Math.max(0, pulse.totalStudents - 6) > 999
                        ? "1K"
                        : pulse.totalStudents - 6}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {pulse.channels.map((ch) => {
                  const Icon = channelIcon(ch.type);
                  return (
                    <span
                      key={`${ch.type}-${ch.name}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F7F7] text-xs font-semibold text-gray-600"
                    >
                      <Icon className="w-3 h-3 text-primary" />
                      #{ch.name}
                      <span className="text-emerald-500 font-bold">
                        {ch.activity}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Middle cards */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="rounded-[1.75rem] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col min-h-[240px]">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  Mentorship coverage
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">
                  Students with an active mentor stay engaged longer. Current
                  mentor seat fill is{" "}
                  <span className="font-bold text-emerald-500">
                    {pulse.mentorMatchRate}%
                  </span>
                  .
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-emerald-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, pulse.mentorMatchRate))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {pulse.mentorMatchRate}%
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400 font-medium">
                  Live mentor–mentee capacity across{" "}
                  {categoryId ? "this program" : "all programs"}
                </p>
              </div>

              <div className="rounded-[1.75rem] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col min-h-[240px]">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-5">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  Top mentors
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed mb-4">
                  Ranked by active mentees on the platform right now.
                </p>
                <div className="mt-auto space-y-3">
                  {pulse.topMentors.slice(0, 3).map((m, i) => (
                    <div key={m._id} className="flex items-center gap-3 group">
                      <span className="text-xs font-black text-gray-300 w-4">
                        {i + 1}
                      </span>
                      <img
                        src={m.avatar || "/gygiLogo.jpg"}
                        alt={m.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {m.role}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {formatMentees(m.menteeCount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity chart */}
            <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Radio className="w-4 h-4 text-primary" />
                    <h3 className="text-lg sm:text-xl font-black text-foreground">
                      Community activity
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    Last 24 hours ·{" "}
                    {isLive
                      ? "real messages across community channels"
                      : "sample activity preview"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-semibold text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Quiet
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Active
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Peak
                  </span>
                </div>
              </div>

              <div className="mt-6 h-40 sm:h-48 flex items-end gap-[3px] sm:gap-1.5">
                {pulse.activity.map((bar, i) => (
                  <div
                    key={bar.hour}
                    className="flex-1 flex flex-col items-center justify-end h-full relative"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar === i && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-indigo-950 text-white text-[9px] font-bold whitespace-nowrap shadow-lg z-10">
                        {bar.count} message{bar.count === 1 ? "" : "s"}
                      </div>
                    )}
                    <div
                      className={`w-full max-w-[14px] sm:max-w-[18px] rounded-full transition-all duration-300 ${barColor(bar.tone)} ${
                        hoveredBar === i
                          ? "opacity-100 scale-x-110"
                          : "opacity-90"
                      }`}
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between px-0.5">
                {["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-medium text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Peak community chatter around{" "}
                  <span className="font-bold text-primary">
                    {pulse.peakHourLabel}
                  </span>
                  {pulse.liveClassParticipants > 0 ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-bold text-foreground">
                        {pulse.liveClassParticipants}
                      </span>{" "}
                      in live class right now
                    </>
                  ) : null}
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors shrink-0"
                >
                  <Users className="w-4 h-4" />
                  Enter community
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 font-medium">
              {isLive
                ? `Updated ${new Date(pulse.updatedAt).toLocaleTimeString()} · refreshes every ${POLL_MS / 1000}s`
                : "Showing preview data · live stats appear when the API is available"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunityDriven;
