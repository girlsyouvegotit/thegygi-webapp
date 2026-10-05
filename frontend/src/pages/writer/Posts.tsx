import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { WriterListSkeleton } from "@/components/loading/PageSkeleton";

interface PostRow {
  _id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  updatedAt: string;
  publishedAt?: string;
  viewCount?: number;
}

const WriterPosts = () => {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(
    statusFromUrl === "draft" ||
      statusFromUrl === "published" ||
      statusFromUrl === "archived"
      ? statusFromUrl
      : "all",
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/content/writer/posts", {
        params: { q: q || undefined, status },
      });
      setPosts(data.data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    try {
      await api.delete(`/content/writer/posts/${id}`);
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error("Could not delete post");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-900">
            Blog posts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Draft, publish, and manage stories for the public blog.
          </p>
        </div>
        <Link
          to="/writer/posts/new"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={onSearch} className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-primary/40"
          />
        </form>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-indigo-900"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm">
        {loading ? (
          <WriterListSkeleton />
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            No posts match your filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div
                key={post._id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-indigo-900">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {post.category} · updated{" "}
                    {format(new Date(post.updatedAt), "MMM d, yyyy")}
                    {typeof post.viewCount === "number"
                      ? ` · ${post.viewCount} views`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      post.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : post.status === "draft"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.status}
                  </span>
                  {post.status === "published" && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    to={`/writer/posts/${post._id}/edit`}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={deleting === post._id}
                    onClick={() => void onDelete(post._id)}
                    className="rounded-full p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {deleting === post._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WriterPosts;
