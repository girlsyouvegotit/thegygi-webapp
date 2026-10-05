import { useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export type VolumePoint = {
  key: string;
  label: string;
  date: Date;
  /** Event count in this bucket */
  events: number;
  /** Unique actors in this bucket */
  actors: number;
};

export type VolumeFilterTab = {
  value: string;
  label: string;
};

type ActivityVolumeVizProps = {
  points: VolumePoint[];
  filters: VolumeFilterTab[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  activePointKey?: string | null;
  onSelectPoint: (point: VolumePoint) => void;
  title?: string;
  className?: string;
};

type Pt = { x: number; y: number };

function smoothLine(pts: Pt[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function areaPath(pts: Pt[], baselineY: number): string {
  if (pts.length === 0) return "";
  const line = smoothLine(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`;
}

const SECONDARY = "#F59E0B";

const ActivityVolumeViz = ({
  points,
  filters,
  activeFilter,
  onFilterChange,
  activePointKey,
  onSelectPoint,
  title = "Activity volume",
  className,
}: ActivityVolumeVizProps) => {
  const uid = useId().replace(/:/g, "");
  const [view, setView] = useState<"charts" | "table">("charts");
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  const W = 640;
  const H = 280;
  const pad = { l: 52, r: 56, t: 28, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const stats = useMemo(() => {
    const maxEvents = Math.max(1, ...points.map((p) => p.events));
    const maxActors = Math.max(1, ...points.map((p) => p.actors));
    const avgEvents =
      points.length === 0
        ? 0
        : points.reduce((s, p) => s + p.events, 0) / points.length;
    const avgActors =
      points.length === 0
        ? 0
        : points.reduce((s, p) => s + p.actors, 0) / points.length;

    // Nice left scale (events) — round up to pleasant step
    const leftMax = Math.max(4, Math.ceil(maxEvents * 1.15));
    const rightMax = Math.max(2, Math.ceil(maxActors * 1.25));

    return { maxEvents, maxActors, avgEvents, avgActors, leftMax, rightMax };
  }, [points]);

  const series = useMemo(() => {
    const n = Math.max(points.length, 1);
    const eventPts: Pt[] = points.map((p, i) => ({
      x: pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: pad.t + innerH - (p.events / stats.leftMax) * innerH,
    }));
    const actorPts: Pt[] = points.map((p, i) => ({
      x: pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: pad.t + innerH - (p.actors / stats.rightMax) * innerH,
    }));
    return { eventPts, actorPts };
  }, [points, stats.leftMax, stats.rightMax, innerW, innerH, pad.l, pad.t]);

  const resolvedFocus = useMemo(() => {
    if (points.length === 0) return null;
    if (focusIdx != null && points[focusIdx]) return focusIdx;
    if (activePointKey) {
      const i = points.findIndex((p) => p.key === activePointKey);
      if (i >= 0) return i;
    }
    // default: peak events
    let best = 0;
    points.forEach((p, i) => {
      if (p.events > points[best].events) best = i;
    });
    return best;
  }, [points, focusIdx, activePointKey]);

  const focusPoint =
    resolvedFocus != null ? points[resolvedFocus] : null;
  const focusEventPt =
    resolvedFocus != null ? series.eventPts[resolvedFocus] : null;
  const focusActorPt =
    resolvedFocus != null ? series.actorPts[resolvedFocus] : null;

  const timelineWindow = useMemo(() => {
    if (points.length <= 5) return points;
    const center = resolvedFocus ?? Math.floor(points.length / 2);
    let start = Math.max(0, center - 2);
    let end = start + 5;
    if (end > points.length) {
      end = points.length;
      start = Math.max(0, end - 5);
    }
    return points.slice(start, end);
  }, [points, resolvedFocus]);

  const shiftFocus = (dir: -1 | 1) => {
    if (points.length === 0) return;
    const cur = resolvedFocus ?? 0;
    const next = Math.min(points.length - 1, Math.max(0, cur + dir));
    setFocusIdx(next);
    onSelectPoint(points[next]);
  };

  const leftTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    t,
    label: String(Math.round(stats.leftMax * t)),
    y: pad.t + innerH * (1 - t),
  }));
  const rightTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    t,
    label: String(Math.round(stats.rightMax * t)),
    y: pad.t + innerH * (1 - t),
  }));

  const avgEventsY =
    pad.t + innerH - (stats.avgEvents / stats.leftMax) * innerH;
  const avgActorsY =
    pad.t + innerH - (stats.avgActors / stats.rightMax) * innerH;

  return (
    <div className={cn("min-w-0", className)}>
      {/* Header — statistics chrome */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15"
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h3 className="text-center text-base font-semibold tracking-tight text-white sm:text-lg">
          {title}
        </h3>
        <div className="inline-flex shrink-0 rounded-full bg-black/40 p-0.5 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setView("charts")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
              view === "charts"
                ? "bg-white/15 text-white"
                : "text-white/45 hover:text-white/70",
            )}
          >
            Charts
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
              view === "table"
                ? "bg-white/15 text-white"
                : "text-white/45 hover:text-white/70",
            )}
          >
            Table
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-5">
        {filters.map((tab) => {
          const active = activeFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                "shrink-0 border-b-2 pb-1 text-xs font-medium transition sm:text-sm",
                active
                  ? "border-white text-white"
                  : "border-transparent text-white/40 hover:text-white/70",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] bg-[#1C1C24] ring-1 ring-white/10">
        {view === "table" ? (
          <div className="max-h-[280px] overflow-auto p-3 sm:p-4">
            <table className="w-full min-w-[320px] text-left text-xs text-white/80">
              <thead className="sticky top-0 bg-[#1C1C24] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-2 py-2 font-semibold">Bucket</th>
                  <th className="px-2 py-2 font-semibold">Events</th>
                  <th className="px-2 py-2 font-semibold">Actors</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr
                    key={p.key}
                    className={cn(
                      "cursor-pointer border-t border-white/5 transition hover:bg-white/5",
                      activePointKey === p.key && "bg-primary/15",
                    )}
                    onClick={() => {
                      setFocusIdx(points.indexOf(p));
                      onSelectPoint(p);
                    }}
                  >
                    <td className="px-2 py-2 font-medium text-white">
                      {p.label}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{p.events}</td>
                    <td className="px-2 py-2 tabular-nums">{p.actors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[220px] w-full sm:h-[260px] lg:h-[280px]"
            role="img"
            aria-label="Activity volume dual series chart"
          >
            <defs>
              <linearGradient id={`${uid}-ev`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`${uid}-ac`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SECONDARY} stopOpacity="0.5" />
                <stop offset="100%" stopColor={SECONDARY} stopOpacity="0.02" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid */}
            <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
              {leftTicks.map((tick) => (
                <line
                  key={`h-${tick.t}`}
                  x1={pad.l}
                  y1={tick.y}
                  x2={W - pad.r}
                  y2={tick.y}
                />
              ))}
              {points.map((_, i) => {
                const n = Math.max(points.length - 1, 1);
                const x = pad.l + (i / n) * innerW;
                return (
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1={pad.t}
                    x2={x}
                    y2={pad.t + innerH}
                  />
                );
              })}
            </g>

            {/* Average lines */}
            <g strokeDasharray="4 5" strokeWidth="1.2">
              <line
                x1={pad.l}
                y1={avgEventsY}
                x2={W - pad.r}
                y2={avgEventsY}
                stroke="var(--primary)"
                opacity="0.75"
              />
              <line
                x1={pad.l}
                y1={avgActorsY}
                x2={W - pad.r}
                y2={avgActorsY}
                stroke={SECONDARY}
                opacity="0.75"
              />
            </g>
            <text
              x={pad.l + 6}
              y={avgEventsY - 6}
              fill="var(--primary)"
              fontSize="8"
              fontWeight="700"
              letterSpacing="0.06em"
              opacity="0.9"
            >
              {Math.round(stats.avgEvents)} AVG EVENTS
            </text>
            <text
              x={W - pad.r - 6}
              y={avgActorsY - 6}
              fill={SECONDARY}
              fontSize="8"
              fontWeight="700"
              letterSpacing="0.06em"
              textAnchor="end"
              opacity="0.9"
            >
              AVG ACTORS {Math.round(stats.avgActors * 10) / 10}
            </text>

            {/* Areas */}
            <path
              d={areaPath(series.eventPts, pad.t + innerH)}
              fill={`url(#${uid}-ev)`}
              className="pointer-events-none"
            />
            <path
              d={areaPath(series.actorPts, pad.t + innerH)}
              fill={`url(#${uid}-ac)`}
              className="pointer-events-none"
            />

            {/* Strokes */}
            <path
              d={smoothLine(series.eventPts)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter={`url(#${uid}-glow)`}
              className="pointer-events-none"
            />
            <path
              d={smoothLine(series.actorPts)}
              fill="none"
              stroke={SECONDARY}
              strokeWidth="2.4"
              strokeLinecap="round"
              filter={`url(#${uid}-glow)`}
              className="pointer-events-none"
            />

            {/* Invisible hit targets */}
            {points.map((p, i) => {
              const n = Math.max(points.length - 1, 1);
              const x = pad.l + (i / n) * innerW;
              return (
                <rect
                  key={p.key}
                  x={x - innerW / points.length / 2}
                  y={pad.t}
                  width={Math.max(innerW / points.length, 24)}
                  height={innerH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setFocusIdx(i)}
                  onClick={() => {
                    setFocusIdx(i);
                    onSelectPoint(p);
                  }}
                />
              );
            })}

            {/* Focus markers */}
            {focusPoint && focusEventPt && focusActorPt && (
              <g filter={`url(#${uid}-glow)`}>
                <circle
                  cx={focusEventPt.x}
                  cy={focusEventPt.y}
                  r="7"
                  fill="var(--primary)"
                  stroke="#1C1C24"
                  strokeWidth="2"
                />
                <text
                  x={focusEventPt.x + 12}
                  y={focusEventPt.y - 8}
                  fill="var(--primary)"
                  fontSize="14"
                  fontWeight="800"
                >
                  {focusPoint.events}
                </text>
                <circle
                  cx={focusActorPt.x}
                  cy={focusActorPt.y}
                  r="7"
                  fill={SECONDARY}
                  stroke="#1C1C24"
                  strokeWidth="2"
                />
                <text
                  x={focusActorPt.x + 12}
                  y={focusActorPt.y + 16}
                  fill={SECONDARY}
                  fontSize="13"
                  fontWeight="800"
                >
                  {focusPoint.actors} actors
                </text>
              </g>
            )}

            {/* Left axis */}
            <g fill="var(--primary)" opacity="0.85">
              <text
                x={14}
                y={pad.t + 8}
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.08em"
                transform={`rotate(-90 14 ${pad.t + innerH / 2})`}
                textAnchor="middle"
              >
                EVENTS (more = busier)
              </text>
              {leftTicks.map((tick) => (
                <text
                  key={`lt-${tick.t}`}
                  x={pad.l - 8}
                  y={tick.y + 3}
                  fontSize="9"
                  textAnchor="end"
                  fill="rgba(255,255,255,0.45)"
                >
                  {tick.label}
                </text>
              ))}
            </g>

            {/* Right axis */}
            <g fill={SECONDARY} opacity="0.9">
              <text
                x={W - 12}
                y={pad.t + 8}
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.08em"
                transform={`rotate(90 ${W - 12} ${pad.t + innerH / 2})`}
                textAnchor="middle"
              >
                ACTORS (unique)
              </text>
              {rightTicks.map((tick) => (
                <text
                  key={`rt-${tick.t}`}
                  x={W - pad.r + 8}
                  y={tick.y + 3}
                  fontSize="9"
                  textAnchor="start"
                  fill="rgba(255,255,255,0.45)"
                >
                  {tick.label}
                </text>
              ))}
            </g>
          </svg>
        )}
      </div>

      {/* Timeline footer */}
      <div className="mt-4 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => shiftFocus(-1)}
          disabled={resolvedFocus === 0 || points.length === 0}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C1C24] text-white ring-1 ring-white/10 transition enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto sm:gap-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {timelineWindow.map((p) => {
            const active =
              (resolvedFocus != null && points[resolvedFocus]?.key === p.key) ||
              activePointKey === p.key;
            const idx = points.findIndex((x) => x.key === p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setFocusIdx(idx);
                  onSelectPoint(p);
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs",
                  active
                    ? "bg-[#1C1C24] text-white ring-1 ring-white/20"
                    : "text-slate-400 hover:text-slate-700",
                )}
              >
                {format(p.date, "dd.MM.yyyy")}
                {active && <ChevronDown className="h-3 w-3 opacity-70" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => shiftFocus(1)}
          disabled={
            resolvedFocus === points.length - 1 || points.length === 0
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C1C24] text-white ring-1 ring-white/10 transition enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ActivityVolumeViz;
