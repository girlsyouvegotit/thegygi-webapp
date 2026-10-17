import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  GraduationCap,
  Home,
  KeyRound,
  LogIn,
  UserPlus,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import TrackingEye from "@/components/auth/TrackingEye";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const gygiLogo = "/gygiLogo.jpg";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createGygiIcon = (flag: string) =>
  L.divIcon({
    className: "gygi-auth-marker",
    html: `
      <div class="relative flex flex-col items-center">
        <div class="absolute -top-1 w-3.5 h-3.5 rounded-full bg-[#c147e9]/40 animate-ping"></div>
        <div class="relative w-9 h-9 rounded-full bg-white shadow-xl border-2 border-[#c147e9] flex items-center justify-center text-lg overflow-hidden">
          ${flag}
        </div>
        <div class="relative -mt-1 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#c147e9]"></div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });

const COUNTRIES = [
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
];

export type AuthTab = {
  id: string;
  label: string;
  to: string;
};

export type AuthFeatureCard = {
  icon: ReactNode;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
};

const FEATURE_SPOTS = [
  "left-28 top-[16%] w-56",
  "right-[4%] top-[14%] w-52",
  "right-[6%] bottom-[14%] w-60",
];

const FEATURE_TONES = [
  "bg-white",
  "bg-[#F8E4D4]",
  "bg-[#E7F1FB]",
] as const;

function FeatureCard({
  card,
  tone,
}: {
  card: AuthFeatureCard;
  tone: (typeof FEATURE_TONES)[number];
}) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-slate-700">
        <span className="text-slate-500">{card.icon}</span>
        <p className="text-sm font-semibold tracking-tight">{card.title}</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {card.description}
      </p>
    </>
  );
  const cls = cn(
    "block w-full rounded-[1.35rem] p-4 text-left shadow-[0_16px_40px_rgba(30,40,60,0.12)] transition hover:-translate-y-0.5",
    tone,
  );
  if (card.to) {
    return (
      <Link to={card.to} className={cls}>
        {inner}
      </Link>
    );
  }
  if (card.onClick) {
    return (
      <button type="button" onClick={card.onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

type Props = {
  title: string;
  subtitle?: string;
  greeting?: string;
  activeTab?: string;
  tabs?: AuthTab[];
  features?: AuthFeatureCard[];
  children: ReactNode;
  className?: string;
  wide?: boolean;
};

/** LIX-style spacious glass auth over the GYGI Africa map. */
export default function AuthGlassShell({
  title,
  subtitle,
  greeting = "Welcome to GYGI",
  activeTab,
  tabs,
  features,
  children,
  className,
  wide,
}: Props) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508]">
      {/* Africa map background */}
      <div className="absolute inset-0 z-0 h-full min-h-screen w-full">
        {mapReady ? (
          <MapContainer
            center={[5, 20]}
            zoom={4}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl={false}
            className="h-full w-full"
            style={{ height: "100%", width: "100%", minHeight: "100vh" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {COUNTRIES.slice(0, 4).map((country) => (
              <Circle
                key={`${country.name}-circle`}
                center={[country.lat, country.lng]}
                radius={200000}
                pathOptions={{
                  color: "#c147e9",
                  fillColor: "#c147e9",
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
            ))}
            {COUNTRIES.map((country) => (
              <Marker
                key={country.name}
                position={[country.lat, country.lng]}
                icon={createGygiIcon(country.flag)}
              >
                <Popup>
                  <div className="min-w-[130px] p-1">
                    <p className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                      <span className="text-lg">{country.flag}</span>
                      {country.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      {country.students} learners reached
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-white/25" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-white/45"
        />
      </div>

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-5">
        <ThemeToggle className="bg-white text-slate-700 shadow-[0_10px_30px_rgba(30,40,60,0.12)] hover:bg-white" />
      </div>

      {/* Slim side rail — desktop */}
      <aside className="absolute top-4 bottom-4 left-4 z-20 hidden w-[4.25rem] flex-col items-center rounded-[1.75rem] border border-white/80 bg-white/90 py-4 shadow-[0_18px_50px_rgba(30,40,60,0.12)] lg:flex">
        <Link to="/" className="mb-6" title="GYGI home">
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/20"
          />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          <RailLink to="/" icon={<Home className="h-4 w-4" />} label="Home" />
          <RailLink
            to="/login"
            icon={<LogIn className="h-4 w-4" />}
            label="Log in"
            active={activeTab === "login"}
          />
          <RailLink
            to="/register"
            icon={<UserPlus className="h-4 w-4" />}
            label="Create account"
            active={activeTab === "register"}
          />
          <RailLink
            to="/forgot-password"
            icon={<KeyRound className="h-4 w-4" />}
            label="Reset password"
            active={activeTab === "forgot"}
          />
        </nav>
        <Link
          to="/"
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F1FB] text-xs font-black text-[#1d4e89]"
          title="GYGI"
        >
          G
        </Link>
      </aside>

      {features?.length ? (
        <div className="pointer-events-none absolute inset-0 z-20 hidden xl:block">
          {features.slice(0, 3).map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "pointer-events-auto absolute",
                FEATURE_SPOTS[index],
              )}
            >
              <FeatureCard card={card} tone={FEATURE_TONES[index]} />
            </div>
          ))}
        </div>
      ) : null}

      {/* Main stage */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 lg:pl-28">
        <Link to="/" className="mb-5 flex items-center gap-2.5 lg:hidden">
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-white"
          />
          <span className="text-lg font-semibold text-slate-900">
            GYGI<span className="text-[#7eb0de]">.</span>
          </span>
        </Link>

        <div className="relative mb-4 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          <TrackingEye />
        </div>

        <div className="max-w-lg rounded-[1.6rem] bg-white/75 px-6 py-4 text-center shadow-[0_16px_40px_rgba(30,40,60,0.08)] backdrop-blur-md">
          <p className="text-sm font-medium text-slate-500">{greeting}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        {tabs?.length ? (
          <div className="mt-5 flex gap-1 rounded-full bg-white/90 p-1 shadow-[0_10px_30px_rgba(30,40,60,0.1)]">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Link
                  key={tab.id}
                  to={tab.to}
                  className={cn(
                    "rounded-full px-5 py-2 text-xs font-semibold transition sm:text-sm",
                    active
                      ? "bg-[#E7F1FB] text-[#1d4e89]"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-5 w-full rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_rgba(30,40,60,0.14)] sm:p-6",
            wide ? "max-w-xl" : "max-w-lg",
            className,
          )}
        >
          {children}
        </div>

        {features?.length ? (
          <div className="mt-4 grid w-full max-w-lg gap-3 xl:hidden">
            {features.map((card, index) => (
              <FeatureCard
                key={card.title}
                card={card}
                tone={FEATURE_TONES[index % FEATURE_TONES.length]}
              />
            ))}
          </div>
        ) : null}

        <p className="mt-6 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm">
          <GraduationCap className="h-3.5 w-3.5 text-[#5b93c9]" />
          Free excellent education across Africa
        </p>
      </div>

      <style>{`
        .leaflet-container { z-index: 0; background: #d4d4d8; }
        .leaflet-pane,
        .leaflet-tile,
        .leaflet-marker-icon,
        .leaflet-marker-shadow,
        .leaflet-tile-container { pointer-events: none; }
        .gygi-auth-marker { background: transparent; border: none; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
}

function RailLink({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition",
        active
          ? "bg-[#E7F1FB] text-[#1d4e89] shadow-sm"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
      )}
    >
      {icon}
    </Link>
  );
}

export const authFieldClass = (
  focused: boolean,
  error?: boolean,
  withToggle?: boolean,
) =>
  cn(
    "gygi-auth-field w-full rounded-2xl border bg-[#f4f7fb] py-3.5 pl-11 text-sm text-slate-800 caret-slate-800 placeholder:text-slate-400 outline-none transition",
    withToggle ? "pr-12" : "pr-4",
    error
      ? "border-rose-300 ring-2 ring-rose-100"
      : focused
        ? "border-[#9ec4ea] bg-white ring-2 ring-[#d7ebf8]"
        : "border-slate-200/80 hover:border-slate-300",
  );

export const authEyeBtnClass =
  "absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-800";

export const authLabelClass =
  "text-xs font-medium text-slate-500";

export const authPrimaryBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-[#c5dff6] px-6 py-3.5 text-sm font-semibold text-[#1d4e89] transition hover:bg-[#b7d4f0] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
