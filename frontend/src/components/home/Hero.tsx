import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router";
import {
  X,
  PlayCircle,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowRight,
  ArrowUp,
  Phone,
  Check,
  Globe2,
  MapPinned,
  Users,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createGygiIcon = (flag: string) => {
  return L.divIcon({
    className: "gygi-marker",
    html: `
      <div class="relative flex flex-col items-center">
        <div class="absolute -top-1 w-4 h-4 rounded-full bg-primary/30 animate-ping"></div>
        <div class="relative w-10 h-10 rounded-full bg-white shadow-xl border-2 border-primary flex items-center justify-center text-xl overflow-hidden">
          ${flag}
        </div>
        <div class="relative -mt-1 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary"></div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45],
  });
};

interface Country {
  name: string;
  flag: string;
  students: string;
  lat: number;
  lng: number;
}

/** Current country reach — modest today; 500K+ continent-wide is the 2030+ goal. */
const countries: Country[] = [
  { name: "Nigeria", flag: "🇳🇬", students: "2.4K+", lat: 9.082, lng: 8.675 },
  { name: "Kenya", flag: "🇰🇪", students: "1.1K+", lat: -0.0236, lng: 37.9062 },
  {
    name: "Tanzania",
    flag: "🇹🇿",
    students: "850+",
    lat: -6.369,
    lng: 34.8888,
  },
  { name: "Uganda", flag: "🇺🇬", students: "720+", lat: 1.3733, lng: 32.2903 },
  { name: "Ghana", flag: "🇬🇭", students: "640+", lat: 7.9465, lng: -1.0232 },
  {
    name: "South Africa",
    flag: "🇿🇦",
    students: "510+",
    lat: -30.5595,
    lng: 22.9375,
  },
  {
    name: "Zimbabwe",
    flag: "🇿🇼",
    students: "380+",
    lat: -19.0154,
    lng: 29.1549,
  },
  {
    name: "Mozambique",
    flag: "🇲🇿",
    students: "320+",
    lat: -18.6657,
    lng: 35.5296,
  },
  {
    name: "Gambia",
    flag: "🇬🇲",
    students: "260+",
    lat: 13.4432,
    lng: -15.3101,
  },
  {
    name: "Sierra Leone",
    flag: "🇸🇱",
    students: "240+",
    lat: 8.4606,
    lng: -11.7799,
  },
  {
    name: "Cameroon",
    flag: "🇨🇲",
    students: "230+",
    lat: 7.3697,
    lng: 12.3547,
  },
  { name: "Lesotho", flag: "🇱🇸", students: "180+", lat: -29.61, lng: 28.2336 },
  {
    name: "Benin Republic",
    flag: "🇧🇯",
    students: "170+",
    lat: 9.3077,
    lng: 2.3158,
  },
  { name: "Rwanda", flag: "🇷🇼", students: "160+", lat: -1.9403, lng: 29.8739 },
];

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 5, { duration: 0.85 });
  }, [lat, lng, map]);
  return null;
}

/** Circular offset so the coverflow can loop endlessly */
function coverflowOffset(index: number, active: number, length: number) {
  let diff = index - active;
  const half = Math.floor(length / 2);
  if (diff > half) diff -= length;
  if (diff < -half) diff += length;
  return diff;
}

function countryCardStyle(offset: number): CSSProperties {
  const abs = Math.abs(offset);
  if (abs > 2) {
    return {
      opacity: 0,
      pointerEvents: "none",
      transform: `translateX(${offset * 42}%) translateZ(-220px) rotateY(${offset * -42}deg) scale(0.72)`,
    };
  }

  return {
    transform: `translateX(${offset * 48}%) translateZ(${-abs * 95}px) rotateY(${offset * -38}deg) scale(${1 - abs * 0.1})`,
    opacity: 1 - abs * 0.22,
    zIndex: 20 - abs,
    filter: abs === 0 ? "none" : "brightness(0.92)",
  };
}

function AfricaImpactCarousel({
  activeIndex,
  onChange,
}: {
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) => {
      onChange((activeIndex + dir + countries.length) % countries.length);
    },
    [activeIndex, onChange],
  );

  return (
    <div className="w-full">
      <div
        className="relative mx-auto h-[340px] sm:h-[380px] md:h-[400px] max-w-5xl select-none"
        style={{ perspective: "1100px" }}
        onTouchStart={(e) => {
          touchX.current = e.targetTouches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const delta = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(delta) < 40) return;
          go(delta < 0 ? 1 : -1);
        }}
        onWheel={(e) => {
          // Horizontal trackpad / shift-scroll only — don't steal page scroll
          if (Math.abs(e.deltaX) < 28 || Math.abs(e.deltaX) <= Math.abs(e.deltaY))
            return;
          go(e.deltaX > 0 ? 1 : -1);
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {countries.map((country, index) => {
            const offset = coverflowOffset(index, activeIndex, countries.length);
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            return (
              <button
                key={country.name}
                type="button"
                onClick={() => {
                  if (offset !== 0) onChange(index);
                }}
                className="absolute w-[210px] sm:w-[240px] md:w-[260px] h-[280px] sm:h-[300px] md:h-[320px] rounded-[2rem] border border-white/15 bg-[rgba(28,20,48,0.72)] px-5 py-5 text-left shadow-[0_25px_60px_rgba(15,10,30,0.35)] backdrop-blur-xl transition-[transform,opacity,filter] duration-500 ease-out"
                style={{
                  ...countryCardStyle(offset),
                  transformStyle: "preserve-3d",
                  boxShadow:
                    offset === 0
                      ? "0 30px 70px rgba(193,71,233,0.28), 0 0 0 1px rgba(255,255,255,0.08)"
                      : "0 18px 40px rgba(15,10,30,0.28)",
                }}
                aria-label={`${country.name}, ${country.students} students`}
                aria-current={offset === 0 ? "true" : undefined}
              >
                <div className="flex items-center justify-between text-white/55">
                  <Globe2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold tracking-wide">
                    {country.students} learners
                  </span>
                </div>

                <div className="mt-8 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-4xl shadow-inner ring-1 ring-white/20 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-5xl">
                    {country.flag}
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {country.name}
                  </h3>
                  <p className="mt-2 max-w-[12rem] text-xs leading-relaxed text-white/55 sm:text-[13px]">
                    Free live learning &amp; mentorship with GYGI on the ground.
                  </p>
                </div>

                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-[11px] font-medium text-white/45">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Impact
                  </span>
                  <span className="text-primary font-semibold">
                    {country.students}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("impact-map")
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className="inline-flex items-center gap-2 rounded-full border border-indigo-900/10 bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/15 transition hover:bg-primary"
        >
          <MapPinned className="h-4 w-4" />
          Explore map
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-5 py-2.5 text-sm font-semibold text-foreground shadow-md backdrop-blur-md transition hover:border-primary/30 hover:text-primary"
        >
          See all countries
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {countries.map((country, idx) => (
          <button
            key={country.name}
            type="button"
            aria-label={`Show ${country.name}`}
            onClick={() => onChange(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-indigo-900/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const scheduleItems = [
  {
    name: "Live class: Web Dev",
    time: "9:30 AM – 10:30 AM",
    duration: "1h",
    avatar: "/daniel.jpg",
  },
  {
    name: "Mentor session: Joy",
    time: "11:00 AM – 11:30 AM",
    duration: "30m",
    avatar: "/joy.jpg",
  },
  {
    name: "Live class: UI/UX",
    time: "2:00 PM – 3:00 PM",
    duration: "1h",
    avatar: "/Kofo.jpg",
  },
];

const Hero = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCountryIndex, setActiveCountryIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const activeCountry = countries[activeCountryIndex];

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/register", { state: { email } });
  };

  const handlePlayVideo = () => {
    setIsVideoOpen(true);
    setIsPlaying(true);
    setTimeout(() => videoRef.current?.play(), 100);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoContainerRef.current) {
      if (!document.fullscreenElement) {
        void videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        void document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const closeVideo = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
    setIsVideoOpen(false);
  };

  return (
    <div id="home" className="relative overflow-hidden bg-transparent">
      {/* Soft accents only — page canvas is #F2F2F4 from Home */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(17,24,39,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(17,24,39,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-80 w-80 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-[55%] h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-14 sm:pb-20">
        {/* ===== CENTERED HERO COPY ===== */}
        <div
          className={`text-center max-w-3xl mx-auto transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <a
            href="#programs"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#programs")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 sm:text-sm dark:border-border dark:bg-card dark:text-foreground"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            Free learning across Africa
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </a>

          <h1 className="mt-6 text-4xl font-black uppercase leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem]">
            <span className="block">Education without</span>
            <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <span>limits</span>
              <span className="inline-flex shrink-0 -space-x-3">
                <img
                  src="/frontend.jpg"
                  alt=""
                  className="h-10 w-10 rounded-full border-[3px] border-background object-cover shadow-md sm:h-12 sm:w-12 lg:h-14 lg:w-14"
                />
                <img
                  src="/Kofo.jpg"
                  alt=""
                  className="h-10 w-10 rounded-full border-[3px] border-background object-cover shadow-md sm:h-12 sm:w-12 lg:h-14 lg:w-14"
                />
              </span>
              <span>
                across <span className="text-primary">Africa</span>
              </span>
            </span>
          </h1>

          <form
            onSubmit={handleJoin}
            className="mx-auto mt-8 flex max-w-lg items-center gap-1.5 rounded-full border border-gray-200 bg-white p-1.5 shadow-xl shadow-indigo-900/5 dark:border-border dark:bg-card"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-gray-400 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-primary active:scale-95 dark:bg-primary dark:hover:bg-primary/90"
            >
              Join Now
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <button
            type="button"
            onClick={handlePlayVideo}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/15 bg-card text-primary shadow-sm">
              <PlayCircle className="h-4 w-4" />
            </span>
            Watch Demo
          </button>
        </div>

        {/* ===== THREE FEATURE CARDS ===== */}
        <div
          className={`mt-12 sm:mt-14 grid md:grid-cols-3 gap-4 sm:gap-5 transition-all duration-1000 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Left — analytics */}
          <div className="rounded-[1.5rem] bg-white border border-gray-100 shadow-xl shadow-indigo-900/5 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="font-bold text-foreground dark:text-foreground">
                Students
              </span>
              <span className="text-gray-400 text-xs font-medium dark:text-muted-foreground">
                2030+ goal
              </span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none dark:text-foreground">
                50K+
              </span>
              <span className="inline-flex items-center gap-0.5 text-emerald-500 text-sm font-bold mb-1">
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} />
                soon
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-snug dark:text-muted-foreground">
              The number of learners{" "}
              <span className="font-bold text-foreground dark:text-foreground">
                GYGI
              </span>{" "}
              aims to reach soon — on the path to 500K+ by 2030+.
            </p>

            <div className="mt-6 flex items-center justify-center gap-0 relative py-2">
              <div className="absolute left-4 right-4 top-1/2 h-px border-t border-dashed border-primary/30" />
              <img
                src="/daniel.jpg"
                alt=""
                className="relative z-10 w-9 h-9 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="relative z-10 mx-6 w-9 h-9 rounded-full bg-indigo-950 flex items-center justify-center shadow">
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>

            <p className="mt-auto pt-4 text-xs text-gray-500 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Live classes, mentorship &amp; AI-powered recordings for every
              student.
            </p>
          </div>

          {/* Middle — Banner hero image */}
          <div className="rounded-[1.5rem] bg-white border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden relative min-h-[320px] sm:min-h-[360px]">
            <img
              src="/Banner.jpg"
              alt="Hope for the Girl Child — GYGI"
              className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-3 right-3">
              <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-full pl-1.5 pr-1.5 py-1.5 shadow-lg">
                <img
                  src="/frontend.jpg"
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    Hope for the Girl Child
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Girls You Got It
                  </p>
                </div>
                <a
                  href="tel:+2349064950175"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-white transition-colors hover:bg-primary"
                  aria-label="Call GYGI"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right — schedule */}
          <div className="rounded-[1.5rem] bg-white border border-gray-100 shadow-xl shadow-indigo-900/5 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="font-bold text-foreground">Wed</span>
              <span className="text-gray-400 text-xs font-medium">
                Live schedule
              </span>
            </div>

            <div className="space-y-0 flex-1">
              {scheduleItems.map((item, i) => (
                <div
                  key={item.name}
                  className={`flex items-start gap-3 py-3 ${
                    i < scheduleItems.length - 1
                      ? "border-b border-dashed border-gray-200"
                      : ""
                  }`}
                >
                  <img
                    src={item.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.time}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 shrink-0">
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Managed by
              </p>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-full pl-1.5 pr-1.5 py-1.5 border border-gray-100">
                <img
                  src="/CEO.jpg"
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">Teniade</p>
                  <p className="text-[10px] text-gray-500">CEO</p>
                </div>
                <a
                  href="tel:+2349064950175"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-950 text-white transition-colors hover:bg-primary"
                  aria-label="Call GYGI"
                >
                  <Phone className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 10X / IMPACT BANNER + ORBS ===== */}
        <div
          className={`mt-4 sm:mt-5 grid md:grid-cols-3 gap-4 sm:gap-5 transition-all duration-1000 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="md:col-span-2 relative rounded-[1.5rem] bg-white border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden px-6 sm:px-8 py-7 sm:py-8 flex items-center gap-5 sm:gap-8">
            <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-3xl bg-sky-200/40 rotate-12 blur-sm" />
            <div className="pointer-events-none absolute right-10 bottom-0 w-28 h-28 rounded-2xl bg-primary/10 -rotate-6" />
            <p className="relative z-10 shrink-0 text-5xl font-black leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl dark:text-foreground">
              14
            </p>
            <p className="relative z-10 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base dark:text-muted-foreground">
              Countries reached with free, proven{" "}
              <span className="font-bold text-foreground dark:text-foreground">
                live learning &amp; mentorship
              </span>{" "}
              for African students.
            </p>
          </div>

          {/* Decorative abstract shapes card (fills 3rd column like reference balance) */}
          <div className="hidden md:block relative rounded-[1.5rem] bg-gradient-to-br from-sky-100/80 to-primary/10 border border-white overflow-hidden min-h-[120px]">
            <div className="absolute left-6 top-6 w-20 h-20 rounded-2xl bg-white/70 shadow-lg rotate-6" />
            <div className="absolute right-8 bottom-5 w-24 h-16 rounded-2xl bg-primary/20 -rotate-3" />
            <div className="absolute left-1/3 top-1/2 w-14 h-14 rounded-full bg-sky-300/40 blur-sm" />
          </div>
        </div>
      </section>

      {/* Impact Across Africa — continuous page canvas */}
      <section className="relative z-10 overflow-hidden py-16 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="text-3xl font-black leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Our Impact Across Africa
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Explore countries we serve today — and our path to 500K+ learners
              by 2030+.
            </p>
          </div>

          <AfricaImpactCarousel
            activeIndex={activeCountryIndex}
            onChange={setActiveCountryIndex}
          />

          <div
            id="impact-map"
            className="relative mt-12 overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-primary/10 h-[300px] sm:mt-14 sm:h-[400px] md:h-[450px] lg:h-[500px]"
          >
            <MapContainer
              center={[activeCountry.lat, activeCountry.lng]}
              zoom={4}
              scrollWheelZoom={false}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFlyTo lat={activeCountry.lat} lng={activeCountry.lng} />
              {countries.map((country) => (
                <Marker
                  key={country.name}
                  position={[country.lat, country.lng]}
                  icon={createGygiIcon(country.flag)}
                  eventHandlers={{
                    click: () =>
                      setActiveCountryIndex(
                        countries.findIndex((c) => c.name === country.name),
                      ),
                  }}
                >
                  <Popup>
                    <div className="min-w-[150px] p-2">
                      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <span className="text-xl">{country.flag}</span>
                        {country.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {country.students} learners reached
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {countries.map((country) => (
                <Circle
                  key={`${country.name}-circle`}
                  center={[country.lat, country.lng]}
                  radius={country.name === activeCountry.name ? 220000 : 120000}
                  pathOptions={{
                    color: "#c147e9",
                    fillColor: "#c147e9",
                    fillOpacity:
                      country.name === activeCountry.name ? 0.18 : 0.06,
                    weight: country.name === activeCountry.name ? 2 : 1,
                  }}
                />
              ))}
            </MapContainer>
            <div className="absolute top-4 left-4 z-1000 rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <p className="mb-1 text-xs font-bold text-foreground">
                {activeCountry.flag} {activeCountry.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {activeCountry.students} learners · {countries.length} countries
                reached
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community section moved to Home via CommunityDriven */}

      {isVideoOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeVideo}
        >
          <div
            ref={videoContainerRef}
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideo}
              className="absolute top-3 right-3 z-20 text-white/70 bg-black/50 rounded-full p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              ref={videoRef}
              src="/gygiVideo.MOV"
              className="w-full aspect-video object-contain"
              onClick={togglePlay}
              muted={isMuted}
              playsInline
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex gap-2">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1" />
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .leaflet-container { z-index: 0; }
        .gygi-marker { background: transparent; border: none; }
      `}</style>
    </div>
  );
};

export default Hero;
