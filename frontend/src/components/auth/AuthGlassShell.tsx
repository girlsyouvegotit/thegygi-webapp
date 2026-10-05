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
        {/* Soft dim only — keep Africa map readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 35% at 50% 15%, rgba(193,71,233,0.18), transparent 55%), radial-gradient(ellipse 35% 30% at 90% 90%, rgba(91,95,239,0.12), transparent 50%)",
          }}
        />
      </div>

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-5">
        <ThemeToggle className="bg-white/10 text-white hover:bg-white/20 hover:text-white" />
      </div>

      {/* Slim side rail — desktop */}
      <aside className="absolute top-4 bottom-4 left-4 z-20 hidden w-[4.25rem] flex-col items-center rounded-[1.75rem] border border-white/10 bg-black/35 py-4 backdrop-blur-xl lg:flex">
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
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c147e9] to-[#5B5FEF] text-xs font-black text-white shadow-lg shadow-primary/30"
          title="GYGI"
        >
          G
        </Link>
      </aside>

      {/* Main stage */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 lg:pl-28">
        {/* Mobile brand */}
        <Link
          to="/"
          className="mb-6 flex items-center gap-2.5 lg:hidden"
        >
          <img
            src={gygiLogo}
            alt="GYGI"
            className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/25"
          />
          <span className="text-lg font-black text-white">
            GYGI<span className="text-[#c147e9]">.</span>
          </span>
        </Link>

        {/* Tracking eye */}
        <div className="relative mb-5 flex h-28 w-28 items-center justify-center sm:mb-6 sm:h-32 sm:w-32">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-[#c147e9]/25 blur-3xl"
          />
          <TrackingEye />
        </div>

        <p className="text-sm font-medium text-white/45 sm:text-base">
          {greeting}
        </p>
        <h1 className="mt-1 max-w-lg text-center text-3xl font-black tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-md text-center text-sm text-white/45">
            {subtitle}
          </p>
        ) : null}

        {/* Tabs */}
        {tabs?.length ? (
          <div className="mt-6 flex gap-1 rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur-xl">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Link
                  key={tab.id}
                  to={tab.to}
                  className={cn(
                    "rounded-full px-5 py-2 text-xs font-bold transition sm:text-sm",
                    active
                      ? "bg-[#c147e9] text-white shadow-md shadow-primary/30"
                      : "text-white/45 hover:text-white",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        {/* Glass form panel */}
        <div
          className={cn(
            "mt-6 w-full rounded-[1.75rem] border border-white/12 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            "bg-white/[0.06] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.05]",
            wide ? "max-w-xl" : "max-w-lg",
            className,
          )}
        >
          {children}
        </div>

        {/* Feature cards */}
        {features?.length ? (
          <div
            className={cn(
              "mt-5 grid w-full gap-3",
              features.length >= 3
                ? "max-w-3xl grid-cols-1 sm:grid-cols-3"
                : "max-w-lg grid-cols-1 sm:grid-cols-2",
            )}
          >
            {features.map((card) => {
              const inner = (
                <>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#c147e9]/15 text-[#e879f9]">
                    {card.icon}
                  </span>
                  <p className="text-sm font-bold text-white">{card.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                    {card.description}
                  </p>
                </>
              );
              const cls =
                "rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur-xl transition hover:border-[#c147e9]/35 hover:bg-white/[0.08]";
              if (card.to) {
                return (
                  <Link key={card.title} to={card.to} className={cls}>
                    {inner}
                  </Link>
                );
              }
              if (card.onClick) {
                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={card.onClick}
                    className={cls}
                  >
                    {inner}
                  </button>
                );
              }
              return (
                <div key={card.title} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        ) : null}

        <p className="mt-6 flex items-center gap-2 text-[11px] text-white/30">
          <GraduationCap className="h-3.5 w-3.5 text-[#c147e9]/70" />
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
          ? "bg-[#c147e9] text-white shadow-lg shadow-primary/35"
          : "text-white/45 hover:bg-white/10 hover:text-white",
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
    "gygi-auth-field w-full rounded-2xl border bg-[#0c0a14]/80 py-3.5 pl-11 text-sm text-white caret-white placeholder:text-white/35 outline-none transition backdrop-blur-md",
    withToggle ? "pr-12" : "pr-4",
    error
      ? "border-rose-400/50 ring-2 ring-rose-400/20"
      : focused
        ? "border-[#c147e9]/70 ring-2 ring-[#c147e9]/25 bg-[#0c0a14]/90"
        : "border-white/20 hover:border-white/35",
  );

/** High-contrast password show/hide control for dark glass fields */
export const authEyeBtnClass =
  "absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#2a2438] text-white shadow-md ring-1 ring-white/50 transition hover:bg-[#3a3350] hover:ring-white/70";

export const authLabelClass =
  "text-[11px] font-bold tracking-[0.12em] text-white/40 uppercase";

export const authPrimaryBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c147e9] via-[#b03ad4] to-[#5B5FEF] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(193,71,233,0.4)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
