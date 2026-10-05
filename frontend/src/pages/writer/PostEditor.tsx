import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Save, Eye } from "lucide-react";
import { WriterFormSkeleton } from "@/components/loading/PageSkeleton";

type Status = "draft" | "published" | "archived";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "Education",
  tags: "",
  status: "draft" as Status,
  seoTitle: "",
  seoDescription: "",
};

const WriterPostEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/content/writer/posts/${id}`);
        const post = data.data.post;
        if (cancelled) return;
        setForm({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          coverImage: post.coverImage || "",
          category: post.category || "Education",
          tags: (post.tags || []).join(", "),
          status: post.status || "draft",
          seoTitle: post.seoTitle || "",
          seoDescription: post.seoDescription || "",
        });
      } catch {
        toast.error("Post not found");
        navigate("/writer/posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const payload = () => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    coverImage: form.coverImage.trim() || null,
    category: form.category.trim() || "Education",
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: form.status,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
  });

  const save = async (status?: Status) => {
    const body = { ...payload(), ...(status ? { status } : {}) };
    if (body.title.length < 3 || body.excerpt.length < 10 || body.content.length < 20) {
      toast.error("Title, excerpt, and content need more detail");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const { data } = await api.post("/content/writer/posts", body);
        toast.success(status === "published" ? "Published" : "Draft saved");
        navigate(`/writer/posts/${data.data.post._id}/edit`, { replace: true });
      } else {
        await api.patch(`/content/writer/posts/${id}`, body);
        toast.success(status === "published" ? "Published" : "Saved");
        if (status) setForm((f) => ({ ...f, status }));
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <WriterFormSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-900">
            {isNew ? "New post" : "Edit post"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Write for the GYGI public blog. Drafts stay private until published.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && form.status === "published" && form.slug && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-indigo-900"
            >
              <Eye className="h-4 w-4" />
              View live
            </a>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("draft")}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("published")}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-950 px-4 py-2 text-sm font-bold text-white hover:bg-primary disabled:opacity-60"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <Field label="Title">
          <input
            value={form.title}
            onChange={set("title")}
            className="field"
            placeholder="Story headline"
          />
        </Field>
        <Field label="Slug (optional)">
          <input
            value={form.slug}
            onChange={set("slug")}
            className="field"
            placeholder="auto-generated-from-title"
          />
        </Field>
        <Field label="Excerpt">
          <textarea
            value={form.excerpt}
            onChange={set("excerpt")}
            rows={3}
            className="field"
            placeholder="Short summary for cards and SEO"
          />
        </Field>
        <Field label="Body">
          <textarea
            value={form.content}
            onChange={set("content")}
            rows={16}
            className="field font-mono text-[13px] leading-relaxed"
            placeholder="Write the full article. Use blank lines between paragraphs."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cover image URL or path">
            <input
              value={form.coverImage}
              onChange={set("coverImage")}
              className="field"
              placeholder="/tech1.jpg or https://…"
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={set("category")}
              className="field"
            />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input value={form.tags} onChange={set("tags")} className="field" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set("status")} className="field">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="SEO title">
          <input value={form.seoTitle} onChange={set("seoTitle")} className="field" />
        </Field>
        <Field label="SEO description">
          <textarea
            value={form.seoDescription}
            onChange={set("seoDescription")}
            rows={2}
            className="field"
          />
        </Field>
      </div>

      <style>{`
        .field {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fafafa;
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          outline: none;
        }
        .field:focus { border-color: rgba(193,71,233,0.45); background: white; }
      `}</style>
    </div>
  );
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export default WriterPostEditor;
