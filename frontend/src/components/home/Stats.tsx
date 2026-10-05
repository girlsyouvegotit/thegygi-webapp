import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type UIEvent,
} from "react";
import {
  Briefcase,
  Code2,
  Flower2,
  HeartHandshake,
  Palette,
  X,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "image" | "video";
  url: string;
  alt: string;
}

/** GYGI program imagery for the staggered collage */
const collageMedia: MediaItem[] = [
  { type: "image", url: "/abs1.jpg", alt: "Abstinence education session" },
  { type: "image", url: "/career1.jpg", alt: "Career literacy workshop" },
  { type: "image", url: "/tech1.jpg", alt: "Tech training classroom" },
  { type: "image", url: "/pad1.jpg", alt: "Pad-A-Girl outreach" },
  { type: "image", url: "/gygishot.jpg", alt: "GYGI community" },
  { type: "image", url: "/career2.jpg", alt: "Career mentoring" },
  { type: "image", url: "/tech2.jpg", alt: "Students coding" },
  { type: "image", url: "/abs2.jpg", alt: "Health education" },
  { type: "image", url: "/pad2.jpg", alt: "Dignity support" },
  { type: "image", url: "/skillUp.jpg", alt: "Vocational skills" },
  { type: "image", url: "/tech3.jpg", alt: "Digital skills training" },
  { type: "image", url: "/career3.jpg", alt: "Career guidance" },
  { type: "image", url: "/groupies.jpg", alt: "GYGI learners together" },
];

interface ImpactStory {
  title: string;
  metric: string;
  description: string;
  image: string;
  accent: string;
  icon: ComponentType<LucideProps>;
  tagline: string;
}

/** Same GYGI impact data — card layout with program icons */
const impactStories: ImpactStory[] = [
  {
    title: "Abstinence Education",
    metric: "10,000+ girls reached",
    description:
      "Young girls empowered with health and life skills education across communities we serve.",
    image: "/abs1.jpg",
    accent: "#EC4899",
    icon: HeartHandshake,
    tagline: "Health & life skills",
  },
  {
    title: "Career Literacy",
    metric: "300+ guided pathways",
    description:
      "Guiding girls toward fulfilling career paths and opportunities with practical literacy.",
    image: "/career1.jpg",
    accent: "#3B82F6",
    icon: Briefcase,
    tagline: "Career pathways",
  },
  {
    title: "Tech Training",
    metric: "500+ future-ready",
    description:
      "Coding, AI, and digital skills training that prepares girls for the future workforce.",
    image: "/tech1.jpg",
    accent: "#c147e9",
    icon: Code2,
    tagline: "Digital skills",
  },
  {
    title: "Vocational Training",
    metric: "150+ skilled makers",
    description:
      "Shoemaking, resin art, and crafts that open doors to economic independence.",
    image: "/skillUp.jpg",
    accent: "#F97316",
    icon: Palette,
    tagline: "Hands-on skills",
  },
  {
    title: "Pad-A-Girl",
    metric: "1,300+ supported",
    description:
      "Menstrual hygiene management and dignity support so learning never pauses.",
    image: "/pad1.jpg",
    accent: "#10B981",
    icon: Flower2,
    tagline: "Dignity support",
  },
];

/** Column height pattern for the arched collage (7 columns).
 * Center column stays level with neighbors — no upward peak image. */
const COLUMN_PATTERN = [
  ["h-28 sm:h-32", "h-36 sm:h-44"],
  ["h-40 sm:h-48", "h-28 sm:h-36"],
  ["h-32 sm:h-40", "h-44 sm:h-52"],
  ["h-36 sm:h-44", "h-28 sm:h-32"],
  ["h-36 sm:h-44", "h-40 sm:h-48"],
  ["h-28 sm:h-36", "h-44 sm:h-52"],
  ["h-36 sm:h-44", "h-28 sm:h-32"],
] as const;

function ImpactCard({
  story,
  className,
  glass = false,
  style,
}: {
  story: ImpactStory;
  className?: string;
  glass?: boolean;
  style?: CSSProperties;
}) {
  const Icon = story.icon;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[1.75rem] border border-border bg-card px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]",
        glass && "backdrop-blur-md",
        className
      )}
      style={style}
    >
      {/* Header — avatar + program */}
      <div className="flex items-center gap-3">
        <img
          src={story.image}
          alt=""
          className="h-10 w-10 rounded-full object-cover ring-2 ring-background"
          style={{ boxShadow: `0 0 0 2px ${story.accent}40` }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/gygiLogo.jpg";
          }}
        />
        <p className="truncate text-[15px] font-bold text-foreground">
          {story.title}
        </p>
      </div>

      {/* Body — copy + floating icon */}
      <div className="relative mt-5 flex min-h-[7.5rem] flex-1 items-start gap-3 pr-14 sm:pr-16">
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {story.description}
          </p>
          <p className="mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {story.metric}
          </p>
        </div>

        <div
          className="absolute top-1 right-0 flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_10px_24px_rgba(15,23,42,0.12)] ring-1 ring-border sm:h-14 sm:w-14 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: `${story.accent}18` }}
          aria-hidden
        >
          <Icon
            className="h-6 w-6 sm:h-7 sm:w-7"
            style={{ color: story.accent }}
            strokeWidth={2.1}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4 text-center">
        <p className="text-xs font-medium tracking-wide text-muted-foreground sm:text-[13px]">
          {story.tagline}
          <span className="mx-2 text-border">·</span>
          <span style={{ color: story.accent }}>GYGI</span>
        </p>
      </div>
    </article>
  );
}

function MobileImpactCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const slide = el.querySelector<HTMLElement>("[data-impact-slide]");
    if (!slide) return;
    const slideWidth = slide.offsetWidth + 12; // gap-3
    const idx = Math.round(el.scrollLeft / slideWidth);
    setCurrent(Math.max(0, Math.min(impactStories.length - 1, idx)));
  }, []);

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    const slide = el?.querySelectorAll<HTMLElement>("[data-impact-slide]")[idx];
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="sm:hidden">
      {/* Native overflow scroll = finger swipe without arrows */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="impact-carousel -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {impactStories.map((story) => (
          <div
            key={story.title}
            data-impact-slide
            className="w-[86%] shrink-0 snap-center"
          >
            <ImpactCard story={story} glass />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {impactStories.map((story, idx) => (
          <button
            key={story.title}
            type="button"
            aria-label={`Go to ${story.title}`}
            onClick={() => scrollToIndex(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === current ? "w-5 bg-primary" : "w-1.5 bg-slate-300/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}

const Stats = () => {
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  const columns = useMemo(() => {
    const cols: MediaItem[][] = COLUMN_PATTERN.map(() => []);
    let i = 0;
    COLUMN_PATTERN.forEach((slots, colIdx) => {
      slots.forEach(() => {
        cols[colIdx].push(collageMedia[i % collageMedia.length]);
        i += 1;
      });
    });
    return cols;
  }, []);

  return (
    <section
      id="impact"
      className="relative overflow-hidden bg-transparent py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(193,71,233,0.04),transparent_55%)]"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* ——— Staggered photo collage ——— */}
        <div className="mx-auto mb-12 max-w-5xl sm:mb-16">
          <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-3.5">
            {columns.map((col, colIdx) => {
              const heights = COLUMN_PATTERN[colIdx];
              const lift =
                colIdx === 3
                  ? "translate-y-0"
                  : colIdx === 2 || colIdx === 4
                    ? "translate-y-3 sm:translate-y-4"
                    : colIdx === 1 || colIdx === 5
                      ? "translate-y-6 sm:translate-y-8"
                      : "translate-y-10 sm:translate-y-12";

              return (
                <div
                  key={colIdx}
                  className={`flex min-w-0 flex-1 flex-col gap-2 sm:gap-3 ${lift}`}
                >
                  {col.map((item, rowIdx) => (
                    <button
                      key={`${item.url}-${rowIdx}`}
                      type="button"
                      onClick={() => setLightbox(item)}
                      className={`group relative w-full overflow-hidden rounded-3xl ${heights[rowIdx]} animate-[impact-fade_0.7s_ease-out_both]`}
                      style={{
                        animationDelay: `${colIdx * 60 + rowIdx * 40}ms`,
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/gygishot.jpg";
                        }}
                      />
                      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#c147e9]/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ——— Header ——— */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground shadow-sm">
            Our Impact
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Proven Excellence in{" "}
            <span className="text-primary">Education</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            We don't just teach; we empower. Our metrics show consistent upward
            trajectory across Africa.
          </p>
        </div>

        {/* ——— Mobile glass carousel ——— */}
        <MobileImpactCarousel />

        {/* ——— Desktop / tablet card grid ——— */}
        <div className="hidden sm:block">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {impactStories.slice(0, 3).map((story, idx) => (
              <ImpactCard
                key={story.title}
                story={story}
                className="animate-[impact-rise_0.65s_ease-out_both]"
                style={{ animationDelay: `${180 + idx * 80}ms` }}
              />
            ))}
          </div>
          <div className="mt-5 grid max-w-3xl gap-5 sm:mx-auto sm:grid-cols-2 lg:mt-6 lg:gap-6">
            {impactStories.slice(3).map((story, idx) => (
              <ImpactCard
                key={story.title}
                story={story}
                className="animate-[impact-rise_0.65s_ease-out_both]"
                style={{ animationDelay: `${420 + idx * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.alt}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes impact-fade {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes impact-rise {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default Stats;
