import { useState, useCallback, useMemo, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getTestimonialClientKey } from "@/lib/testimonialClient";

interface TestimonialCard {
  id: string;
  name: string;
  role: string;
  comment: string;
  country: string;
  flag: string;
  rating: number;
  accent: string;
  accentLight: string;
  initials: string;
}

type CardComment = {
  _id: string;
  testimonialId: string;
  authorName: string;
  body: string;
  createdAt: string;
  adminReply?: {
    body: string;
    authorName: string;
    repliedAt: string;
  } | null;
};

const SITE_SHARE_ORIGIN = "https://gygi.org";

function shareUrlFor(id: string) {
  return `${SITE_SHARE_ORIGIN}/#testimonial-${id}`;
}

function parseTestimonialHash(cards: TestimonialCard[]): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const match = hash.match(/^testimonial-(.+)$/);
  if (!match) return null;
  const id = match[1];
  return cards.some((t) => t.id === id) ? id : null;
}

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState<TestimonialCard[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<CardComment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );
  const [copied, setCopied] = useState(false);

  const totalSlides = testimonials.length;
  const current = testimonials[activeIndex];
  const liked = current ? likedIds.has(current.id) : false;
  const cardLikeCount = current ? likeCounts[current.id] ?? 0 : 0;
  const cardCommentCount = current
    ? commentCounts[current.id] ?? comments.length
    : 0;

  const shareUrl = useMemo(
    () => (current ? shareUrlFor(current.id) : SITE_SHARE_ORIGIN),
    [current],
  );

  const shareText = useMemo(() => {
    if (!current) return SITE_SHARE_ORIGIN;
    return `"${current.comment}" — ${current.name}, ${current.role} (${current.country})\n\nRead this story on GYGI:\n${shareUrl}`;
  }, [current, shareUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStories(true);
      try {
        const [{ data: storiesRes }, eng] = await Promise.all([
          api.get("/public/testimonials"),
          api
            .get("/public/testimonials/engagement", {
              params: { clientKey: getTestimonialClientKey() },
            })
            .catch(() => null),
        ]);
        if (cancelled) return;
        const list = ((storiesRes.data?.testimonials || []) as Array<{
          id?: string;
          _id?: string;
          name: string;
          role: string;
          comment?: string;
          body?: string;
          country: string;
          flag?: string;
          rating?: number;
          accent?: string;
          accentLight?: string;
          initials?: string;
        }>).map((t) => ({
          id: String(t.id || t._id),
          name: t.name,
          role: t.role,
          comment: t.comment || t.body || "",
          country: t.country,
          flag: t.flag || "🌍",
          rating: t.rating || 5,
          accent: t.accent || "#c147e9",
          accentLight: t.accentLight || "#f3e0fb",
          initials: t.initials || "GY",
        }));
        setTestimonials(list);

        if (eng) {
          const likes = (eng.data.data?.likes || {}) as Record<string, number>;
          const commentsMap = (eng.data.data?.comments || {}) as Record<
            string,
            number
          >;
          const liked = (eng.data.data?.likedIds || []) as string[];
          setLikeCounts(
            Object.fromEntries(
              list.map((t) => [t.id, Number(likes[t.id] || 0)]),
            ),
          );
          setCommentCounts(
            Object.fromEntries(
              list.map((t) => [t.id, Number(commentsMap[t.id] || 0)]),
            ),
          );
          setLikedIds(new Set(liked.map(String)));
        }

        const hashId = parseTestimonialHash(list);
        if (hashId) {
          const idx = list.findIndex((t) => t.id === hashId);
          if (idx >= 0) setActiveIndex(idx);
        }
      } catch {
        toast.error("Could not load testimonials");
      } finally {
        if (!cancelled) setLoadingStories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (!totalSlides) return;
      setIsAnimating(true);
      setTimeout(() => {
        const next = ((index % totalSlides) + totalSlides) % totalSlides;
        setActiveIndex(next);
        setIsAnimating(false);
        const id = testimonials[next]?.id;
        if (id && typeof window !== "undefined") {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}#testimonial-${id}`,
          );
        }
      }, 350);
    },
    [totalSlides, testimonials],
  );

  useEffect(() => {
    const openFromHash = () => {
      const id = parseTestimonialHash(testimonials);
      if (!id) return;
      const idx = testimonials.findIndex((t) => t.id === id);
      if (idx >= 0) {
        setActiveIndex(idx);
        window.requestAnimationFrame(() => {
          document
            .getElementById("testimonials")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [testimonials]);

  const loadComments = useCallback(async (testimonialId: string) => {
    setCommentsLoading(true);
    try {
      const { data } = await api.get(
        `/public/testimonials/${testimonialId}/comments`,
      );
      const list = (data.data?.comments || []) as CardComment[];
      setComments(list);
      setCommentCounts((prev) => ({ ...prev, [testimonialId]: list.length }));
    } catch {
      toast.error("Could not load comments");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!commentOpen || !current) return;
    void loadComments(current.id);
  }, [current?.id, commentOpen, loadComments, current]);

  const toggleLike = useCallback(async () => {
    if (!current || likeBusy) return;
    setLikeBusy(true);
    const clientKey = getTestimonialClientKey();
    const wasLiked = likedIds.has(current.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [current.id]: Math.max(0, (prev[current.id] || 0) + (wasLiked ? -1 : 1)),
    }));

    try {
      const { data } = await api.post(
        `/public/testimonials/${current.id}/like`,
        { clientKey },
      );
      const likedNow = Boolean(data.data?.liked);
      const count = Number(data.data?.likeCount || 0);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (likedNow) next.add(current.id);
        else next.delete(current.id);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [current.id]: count }));
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(current.id);
        else next.delete(current.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [current.id]: Math.max(
          0,
          (prev[current.id] || 0) + (wasLiked ? 1 : -1),
        ),
      }));
      toast.error("Could not update like");
    } finally {
      setLikeBusy(false);
    }
  }, [current, likeBusy, likedIds]);

  const openComment = useCallback(() => {
    if (!current) return;
    setCommentName("");
    setCommentText("");
    setCommentOpen(true);
  }, [current]);

  const submitComment = useCallback(async () => {
    if (!current) return;
    const name = commentName.trim();
    const message = commentText.trim();
    if (!name) {
      toast.error("Please add your name");
      return;
    }
    if (message.length < 4) {
      toast.error("Please write a short comment");
      return;
    }

    setCommentBusy(true);
    try {
      const { data } = await api.post(
        `/public/testimonials/${current.id}/comments`,
        { authorName: name, body: message },
      );
      const created = data.data?.comment as CardComment | undefined;
      if (created) {
        setComments((prev) => [created, ...prev]);
        setCommentCounts((prev) => ({
          ...prev,
          [current.id]: (prev[current.id] || 0) + 1,
        }));
      } else {
        await loadComments(current.id);
      }
      setCommentName("");
      setCommentText("");
      toast.success("Comment posted");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not post comment");
    } finally {
      setCommentBusy(false);
    }
  }, [commentName, commentText, current, loadComments]);

  const copyShareText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Link copied — opens this story on gygi.org");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please try again.");
    }
  }, [shareText]);

  const handleShare = useCallback(async () => {
    if (!current) return;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: `${current.name} on GYGI`,
          text: `"${current.comment}" — ${current.name}`,
          url: shareUrl,
        });
        toast.success("Thanks for sharing!");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    setShareOpen(true);
  }, [current, shareUrl]);

  const shareToWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [shareText]);

  const shareToX = useCallback(() => {
    if (!current) return;
    const tweet = `"${current.comment.slice(0, 160)}${
      current.comment.length > 160 ? "…" : ""
    }" — ${current.name}\n${shareUrl}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [current, shareUrl]);

  if (loadingStories) {
    return (
      <section
        id="testimonials"
        className="relative flex min-h-[420px] items-center justify-center py-20"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </section>
    );
  }

  if (!current) {
    return (
      <section id="testimonials" className="py-20 text-center text-slate-400">
        No testimonials yet.
      </section>
    );
  }

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-transparent py-20 sm:py-24 lg:py-28"
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #111827 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[35vh] rounded-full blur-[130px] pointer-events-none transition-all duration-700"
        style={{ background: `${current.accent}10` }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
            Testimonials
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
          </span>
          <h2 className="w-full text-center text-3xl font-black leading-[1.02] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
            What Our{" "}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: current.accent }}>
                Students
              </span>
              {/* Soft marker for light mode only — pastel bar reads as a stray underline on dark */}
              <span
                aria-hidden
                className="absolute bottom-1 left-0 right-0 z-0 h-[0.3em] rounded-sm dark:hidden"
                style={{ background: current.accentLight }}
              />
            </span>{" "}
            Say
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mt-4 text-center">
            Real stories from real students across Africa.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-[480px]">
            <div className="absolute inset-0 bg-white rounded-[32px] transform translate-y-4 scale-[0.97] opacity-40 shadow-sm z-0"></div>
            <div className="absolute inset-0 bg-white rounded-[32px] transform translate-y-2 scale-[0.985] opacity-70 shadow-sm z-[1]"></div>

            <div
              className={`relative z-10 bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-100 transition-all duration-500 ${
                isAnimating
                  ? "opacity-0 scale-90 translate-y-6"
                  : "opacity-100 scale-100 translate-y-0"
              }`}
              style={{
                boxShadow:
                  "0 24px 48px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1.5 flex-1 max-w-[280px]">
                  {testimonials.map((_, index) => (
                    <button
                      key={testimonials[index].id}
                      onClick={() => goToSlide(index)}
                      className="h-1 flex-1 rounded-full cursor-pointer transition-all duration-300"
                      style={{
                        background:
                          index <= activeIndex ? "#111827" : "#E5E7EB",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gray-400 ml-3 shrink-0">
                  {activeIndex + 1}/{totalSlides}
                </span>
              </div>

              <div className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2 flex items-center gap-2">

                Student story
              </div>

              <Quote
                className="w-10 h-10 mb-4"
                style={{ color: `${current.accent}30` }}
              />

              <p className="mb-6 text-base font-medium leading-relaxed text-foreground sm:text-lg">
                "{current.comment}"
              </p>

              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)`,
                  }}
                >
                  {current.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {current.name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                    <span>{current.flag}</span>
                    <span className="truncate">
                      {current.role} • {current.country}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5"></div>

              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <button
                  onClick={() => goToSlide(activeIndex - 1)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-300 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleLike()}
                    disabled={likeBusy}
                    aria-label={liked ? "Unlike" : "Like"}
                    aria-pressed={liked}
                    className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      liked
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <Heart
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${liked ? "fill-red-500" : ""}`}
                    />
                    {cardLikeCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {cardLikeCount > 99 ? "99+" : cardLikeCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={openComment}
                    aria-label="Comments"
                    className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {cardCommentCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                        {cardCommentCount > 9 ? "9+" : cardCommentCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    aria-label="Share"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => goToSlide(activeIndex + 1)}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => goToSlide(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === activeIndex ? "28px" : "7px",
                height: "7px",
                background: idx === activeIndex ? "#c147e9" : "#D1D5DB",
              }}
            />
          ))}
        </div>
      </div>

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent
          className="z-[220] w-[calc(100vw-24px)] max-w-md rounded-3xl p-5 sm:p-6"
          overlayClassName="z-[210]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: current.accentLight,
                  color: current.accent,
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </span>
              Comments
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Conversation on {current.name}&apos;s story only
              {cardCommentCount > 0 ? ` · ${cardCommentCount}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
            {commentsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-2xl bg-[#F7F6FB] py-8 text-center text-sm text-slate-400">
                No comments yet — be the first.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  className="rounded-2xl border border-gray-100 bg-white px-3.5 py-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {c.authorName}
                    </p>
                    <p className="shrink-0 text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {c.body}
                  </p>
                  {c.adminReply ? (
                    <div className="mt-2.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
                      <p className="mb-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                        GYGI · {c.adminReply.authorName}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {c.adminReply.body}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-name" className="text-xs font-bold">
                Your name
              </Label>
              <Input
                id="t-name"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="rounded-xl"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-body" className="text-xs font-bold">
                Your comment
              </Label>
              <Textarea
                id="t-body"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="min-h-24 resize-y rounded-xl"
                maxLength={800}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setCommentOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={commentBusy}
              onClick={() => void submitComment()}
            >
              {commentBusy ? "Posting…" : "Post comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent
          className="z-[220] w-[calc(100vw-24px)] max-w-sm rounded-3xl p-5 sm:p-6"
          overlayClassName="z-[210]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              Share this story
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Opens this card on{" "}
              <span className="font-semibold text-foreground">gygi.org</span>.
            </DialogDescription>
          </DialogHeader>
          <p className="truncate rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {shareUrl}
          </p>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => void copyShareText()}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold",
              )}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-500" />
              )}
              {copied ? "Copied!" : "Copy gygi.org link"}
            </button>
            <button
              type="button"
              onClick={shareToWhatsApp}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={shareToX}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4 text-slate-600" />
              Share on X
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Testimonial;
