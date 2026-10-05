import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Save, Globe2 } from "lucide-react";
import { WriterFormSkeleton } from "@/components/loading/PageSkeleton";

type AboutDoc = {
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: {
    hero: {
      headline: string;
      subheadline: string;
      ctaLabel: string;
      ctaHref: string;
    };
    story: { title: string; body: string };
    mission: { mission: string; vision: string };
    whatWeDo: { title: string; body: string };
    impact: { title: string; body: string };
    whoWeServe: { title: string; body: string };
    partners: { title: string; names: string[] };
    getInvolved: { title: string; body: string };
    [key: string]: unknown;
  };
};

const WriterAboutEditor = () => {
  const [about, setAbout] = useState<AboutDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerNames, setPartnerNames] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/content/writer/about");
        if (cancelled) return;
        setAbout(data.data.about);
        setPartnerNames((data.data.about.sections?.partners?.names || []).join(", "));
      } catch {
        toast.error("Failed to load About page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchSection = (section: string, key: string, value: string) => {
    setAbout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...(prev.sections[section] as Record<string, unknown>),
            [key]: value,
          },
        },
      };
    });
  };

  const save = async (publish = false) => {
    if (!about) return;
    setSaving(true);
    try {
      const sections = {
        ...about.sections,
        partners: {
          ...about.sections.partners,
          names: partnerNames
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
        },
      };
      const { data } = await api.put("/content/writer/about", {
        sections,
        seoTitle: about.seoTitle,
        seoDescription: about.seoDescription,
        publish,
      });
      setAbout(data.data.about);
      toast.success(publish ? "About page published" : "About draft saved");
    } catch {
      toast.error("Could not save About page");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !about) {
    return <WriterFormSkeleton />;
  }

  const s = about.sections;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-900">
            About page
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Status:{" "}
            <span className="font-semibold text-primary">{about.status}</span>
            . Changes go live on{" "}
            <Link to="/about" className="font-semibold text-primary underline">
              /about
            </Link>{" "}
            when published.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(false)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(true)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-950 px-4 py-2 text-sm font-bold text-white hover:bg-primary"
          >
            <Globe2 className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      <Section title="Hero">
        <Input
          label="Headline"
          value={s.hero.headline}
          onChange={(v) => patchSection("hero", "headline", v)}
        />
        <Textarea
          label="Subheadline"
          value={s.hero.subheadline}
          onChange={(v) => patchSection("hero", "subheadline", v)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="CTA label"
            value={s.hero.ctaLabel}
            onChange={(v) => patchSection("hero", "ctaLabel", v)}
          />
          <Input
            label="CTA href"
            value={s.hero.ctaHref}
            onChange={(v) => patchSection("hero", "ctaHref", v)}
          />
        </div>
      </Section>

      <Section title="Our story">
        <Input
          label="Title"
          value={s.story.title}
          onChange={(v) => patchSection("story", "title", v)}
        />
        <Textarea
          label="Body"
          rows={8}
          value={s.story.body}
          onChange={(v) => patchSection("story", "body", v)}
        />
      </Section>

      <Section title="Mission & vision">
        <Textarea
          label="Mission"
          value={s.mission.mission}
          onChange={(v) => patchSection("mission", "mission", v)}
        />
        <Textarea
          label="Vision"
          value={s.mission.vision}
          onChange={(v) => patchSection("mission", "vision", v)}
        />
      </Section>

      <Section title="What we do">
        <Input
          label="Title"
          value={s.whatWeDo.title}
          onChange={(v) => patchSection("whatWeDo", "title", v)}
        />
        <Textarea
          label="Body"
          value={s.whatWeDo.body}
          onChange={(v) => patchSection("whatWeDo", "body", v)}
        />
      </Section>

      <Section title="Impact">
        <Input
          label="Title"
          value={s.impact.title}
          onChange={(v) => patchSection("impact", "title", v)}
        />
        <Textarea
          label="Body"
          value={s.impact.body}
          onChange={(v) => patchSection("impact", "body", v)}
        />
      </Section>

      <Section title="Who we serve">
        <Input
          label="Title"
          value={s.whoWeServe.title}
          onChange={(v) => patchSection("whoWeServe", "title", v)}
        />
        <Textarea
          label="Body"
          rows={5}
          value={s.whoWeServe.body}
          onChange={(v) => patchSection("whoWeServe", "body", v)}
        />
      </Section>

      <Section title="Partners">
        <Input
          label="Section title"
          value={s.partners.title}
          onChange={(v) => patchSection("partners", "title", v)}
        />
        <Input
          label="Partner names (comma separated)"
          value={partnerNames}
          onChange={setPartnerNames}
        />
      </Section>

      <Section title="Get involved">
        <Input
          label="Title"
          value={s.getInvolved.title}
          onChange={(v) => patchSection("getInvolved", "title", v)}
        />
        <Textarea
          label="Body"
          value={s.getInvolved.body}
          onChange={(v) => patchSection("getInvolved", "body", v)}
        />
      </Section>

      <Section title="SEO">
        <Input
          label="SEO title"
          value={about.seoTitle || ""}
          onChange={(v) => setAbout({ ...about, seoTitle: v })}
        />
        <Textarea
          label="SEO description"
          value={about.seoDescription || ""}
          onChange={(v) => setAbout({ ...about, seoDescription: v })}
        />
      </Section>
    </div>
  );
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-indigo-900">{title}</h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/8 bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:bg-white"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/8 bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:bg-white"
      />
    </label>
  );
}

export default WriterAboutEditor;
