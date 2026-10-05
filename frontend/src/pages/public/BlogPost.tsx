import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "@/lib/api";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PageSeo } from "@/components/seo/PageSeo";
import { absoluteUrl, getSiteUrl, organizationJsonLd } from "@/lib/seo";

interface Post {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  author?: { name?: string; avatar?: string; bio?: string };
}

interface Related {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  publishedAt?: string;
}

function renderBody(content: string) {
  return content
    .split(/\n\n+/)
    .filter(Boolean)
    .map((block, i) => (
      <p key={i} className="text-[17px] leading-[1.75] text-slate-600 dark:text-muted-foreground">
        {block.split("\n").map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {line}
          </span>
        ))}
      </p>
    ));
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Related[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/content/blog/${slug}`);
        if (cancelled) return;
        setPost(data.data.post);
        setRelated(data.data.related || []);
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const postJsonLd =
    post && slug
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt,
          image: absoluteUrl(post.coverImage || "/Banner.jpg"),
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: {
            "@type": "Person",
            name: post.author?.name || "GYGI Writer",
          },
          publisher: {
            "@type": "Organization",
            name: "Girls You've Got It",
            logo: {
              "@type": "ImageObject",
              url: absoluteUrl("/gygiLogo.jpg"),
            },
            url: getSiteUrl(),
          },
          mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
          articleSection: post.category,
          keywords: (post.tags || []).join(", "),
        }
      : undefined;

  return (
    <div className="public-marketing bg-white font-sans text-foreground dark:bg-background">
      {post && slug ? (
        <PageSeo
          title={post.seoTitle || `${post.title} | GYGI Journal`}
          description={
            post.seoDescription ||
            post.excerpt ||
            `Read ${post.title} on the GYGI Journal — free education stories for girls and young women.`
          }
          path={`/blog/${slug}`}
          image={post.coverImage || "/Banner.jpg"}
          type="article"
          publishedTime={post.publishedAt}
          modifiedTime={post.updatedAt || post.publishedAt}
          authorName={post.author?.name}
          jsonLd={[organizationJsonLd(), postJsonLd!]}
        />
      ) : (
        <PageSeo
          title={missing ? "Story not found | GYGI Journal" : "Loading story | GYGI Journal"}
          description="GYGI Journal — stories of learning, dignity, and impact."
          path={slug ? `/blog/${slug}` : "/blog"}
          noIndex={missing}
        />
      )}
      <Navbar />
      <main>
        {loading ? (
          <div className="flex justify-center py-28">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : missing || !post ? (
          <div className="mx-auto max-w-xl px-5 py-28 text-center">
            <h1 className="text-2xl font-black text-[#1E1B4B]">
              Story not found
            </h1>
            <p className="mt-2 text-slate-500 dark:text-muted-foreground">
              This post may be unpublished or the link is incorrect.
            </p>
            <Link
              to="/blog"
              className="mt-6 inline-flex font-semibold text-primary"
            >
              Back to blog
            </Link>
          </div>
        ) : (
          <>
            <article>
              <header className="relative overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(193,71,233,0.12), transparent 60%)",
                  }}
                />
                <div className="relative mx-auto max-w-3xl px-5 pt-10 pb-8 sm:px-8 sm:pt-14">
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary dark:text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to blog
                  </Link>
                  <p className="mt-8 text-xs font-bold tracking-[0.18em] text-primary uppercase">
                    {post.category}
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1E1B4B] sm:text-4xl md:text-5xl md:leading-[1.1]">
                    {post.title}
                  </h1>
                  <p className="mt-5 text-lg leading-relaxed text-slate-500 dark:text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author?.avatar || "/gygiLogo.jpg"}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/10"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1E1B4B]">
                          {post.author?.name || "GYGI"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-muted-foreground">
                          {post.publishedAt
                            ? format(new Date(post.publishedAt), "MMMM d, yyyy")
                            : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary dark:border-border dark:bg-card dark:text-muted-foreground"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Copy link
                    </button>
                  </div>
                </div>
              </header>

              {post.coverImage && (
                <div className="mx-auto max-w-5xl px-0 sm:px-8">
                  <img
                    src={post.coverImage}
                    alt=""
                    className="aspect-[16/9] w-full object-cover sm:rounded-[1.5rem] sm:shadow-[0_20px_60px_rgba(30,27,75,0.12)]"
                  />
                </div>
              )}

              <div className="mx-auto max-w-3xl space-y-5 px-5 py-10 sm:px-8 sm:py-14">
                {renderBody(post.content)}

                {(post.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {post.tags!.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-[#FAF5FF] px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {related.length > 0 && (
              <section className="border-t border-slate-100 bg-[#FAFAFC] px-5 py-14 dark:border-border dark:bg-muted/30 sm:px-8">
                <div className="mx-auto max-w-6xl">
                  <h2 className="text-2xl font-black text-[#1E1B4B]">
                    Related stories
                  </h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    {related.map((r, i) => {
                      const tones = [
                        "bg-[#FFF1E8]",
                        "bg-[#F3E8FF]",
                        "bg-[#E8F4FF]",
                      ];
                      return (
                        <Link
                          key={r.slug}
                          to={`/blog/${r.slug}`}
                          className="group overflow-hidden rounded-[1.35rem] border border-black/[0.04] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <img
                            src={r.coverImage || "/gygishot.jpg"}
                            alt=""
                            className="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className={`p-4 ${tones[i % tones.length]}`}>
                            <p className="text-[10px] font-bold tracking-wide text-primary uppercase">
                              {r.category}
                            </p>
                            <p className="mt-1 line-clamp-2 font-bold text-[#1E1B4B] group-hover:text-primary">
                              {r.title}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
              <div className="rounded-[1.75rem] bg-primary px-6 py-12 text-center text-white sm:px-12">
                <h3 className="text-2xl font-black sm:text-3xl">
                  Learn free with GYGI
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/80 sm:text-base">
                  Join live classes, mentorship, and programs built for African
                  girls.
                </p>
                <Link
                  to="/register"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary transition hover:bg-[#FAF5FF] dark:bg-card dark:hover:bg-primary/15"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
