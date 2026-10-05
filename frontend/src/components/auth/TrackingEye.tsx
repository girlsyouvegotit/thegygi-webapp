import { useEffect, useMemo, useRef, useState } from "react";

const SIZE = 120;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 54;
const IRIS_R = 24;
const PUPIL_R = 9;
const GRID = 4.2;

type Dot = { x: number; y: number; r: number };

function buildScleraDots(): Dot[] {
  const dots: Dot[] = [];
  // Highlight bias — denser cream on upper-left like the reference
  const hx = CX - 14;
  const hy = CY - 10;

  for (let y = GRID / 2; y < SIZE; y += GRID) {
    for (let x = GRID / 2; x < SIZE; x += GRID) {
      const dx = x - CX;
      const dy = y - CY;
      const dist = Math.hypot(dx, dy);
      if (dist > OUTER_R) continue;

      const edge = 1 - dist / OUTER_R;
      const highlight = 1 - Math.min(1, Math.hypot(x - hx, y - hy) / 70);
      // Soft crescent: stronger on left/top, fades right
      const side = 0.55 + 0.45 * (1 - (x - (CX - OUTER_R)) / (OUTER_R * 2));
      const intensity = Math.pow(edge, 0.85) * (0.35 + 0.65 * highlight) * side;
      const r = 0.35 + intensity * 1.85;
      if (r < 0.45) continue;
      dots.push({ x, y, r });
    }
  }
  return dots;
}

function buildIrisDots(): Dot[] {
  const dots: Dot[] = [];
  const step = GRID * 0.92;

  for (let y = -IRIS_R; y <= IRIS_R; y += step) {
    for (let x = -IRIS_R; x <= IRIS_R; x += step) {
      const dist = Math.hypot(x, y);
      if (dist > IRIS_R || dist < PUPIL_R) continue;

      const fromPupil = (dist - PUPIL_R) / (IRIS_R - PUPIL_R);
      // Dense near pupil ring, soft outer fade
      const ring = Math.sin(Math.min(1, fromPupil) * Math.PI);
      const edgeFade = 1 - Math.pow(fromPupil, 1.4);
      const intensity = 0.45 + 0.55 * ring * edgeFade;
      const r = 0.4 + intensity * 1.7;
      dots.push({ x: CX + x, y: CY + y, r });
    }
  }
  return dots;
}

/** Halftone GYGI eye — cream sclera + purple iris, tracks pointer. */
export default function TrackingEye() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const sclera = useMemo(() => buildScleraDots(), []);
  const iris = useMemo(() => buildIrisDots(), []);

  useEffect(() => {
    const max = 11;

    const lookAt = (clientX: number, clientY: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const clamp = Math.min(max, dist / 16);
      setOffset({ x: (dx / dist) * clamp, y: (dy / dist) * clamp });
    };

    const onPointer = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) {
        const t = e.touches[0];
        if (t) lookAt(t.clientX, t.clientY);
        return;
      }
      lookAt(e.clientX, e.clientY);
    };

    const onScroll = () => {
      lookAt(
        window.innerWidth / 2 + (window.scrollY % 40) - 20,
        window.innerHeight / 2,
      );
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      lookAt(
        window.innerWidth / 2 + (e.gamma ?? 0) * 6,
        window.innerHeight / 2 + (e.beta ?? 0) * 3,
      );
    };

    window.addEventListener("mousemove", onPointer, { passive: true });
    window.addEventListener("touchmove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("deviceorientation", onOrient);

    return () => {
      window.removeEventListener("mousemove", onPointer);
      window.removeEventListener("touchmove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-28 w-28 overflow-hidden rounded-full bg-[#0a0612] shadow-[0_0_36px_rgba(193,71,233,0.35)] ring-1 ring-white/10 sm:h-32 sm:w-32"
      aria-hidden
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
        {/* Deep navy disc */}
        <circle cx={CX} cy={CY} r={OUTER_R + 2} fill="#0a0612" />

        {/* Cream/off-white sclera halftone */}
        <g fill="#F3EDE6">
          {sclera.map((d, i) => (
            <circle key={`s-${i}`} cx={d.x} cy={d.y} r={d.r} />
          ))}
        </g>

        {/* Purple iris + pupil void — tracks */}
        <g
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 70ms linear",
          }}
        >
          <g fill="#c147e9">
            {iris.map((d, i) => (
              <circle key={`i-${i}`} cx={d.x} cy={d.y} r={d.r} />
            ))}
          </g>
          {/* Soft brighter ring accents (GYGI fuchsia) */}
          <g fill="#e879f9" opacity="0.55">
            {iris
              .filter((_, i) => i % 5 === 0)
              .map((d, i) => (
                <circle key={`a-${i}`} cx={d.x} cy={d.y} r={d.r * 0.7} />
              ))}
          </g>
          {/* Pupil void */}
          <circle cx={CX} cy={CY} r={PUPIL_R} fill="#0a0612" />
        </g>
      </svg>
    </div>
  );
}
