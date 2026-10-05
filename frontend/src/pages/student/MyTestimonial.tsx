import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ExternalLink, Quote, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";

type Mine = {
  _id: string;
  role: string;
  body: string;
  country: string;
  flag: string;
  rating: number;
  status: string;
};

const FLAG_OPTIONS = [
  { country: "Nigeria", flag: "🇳🇬" },
  { country: "Ghana", flag: "🇬🇭" },
  { country: "Kenya", flag: "🇰🇪" },
  { country: "Tanzania", flag: "🇹🇿" },
  { country: "South Africa", flag: "🇿🇦" },
  { country: "Zimbabwe", flag: "🇿🇼" },
  { country: "Uganda", flag: "🇺🇬" },
  { country: "Rwanda", flag: "🇷🇼" },
  { country: "Other", flag: "🌍" },
];

export default function MyTestimonialPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Mine | null>(null);
  const [programRole, setProgramRole] = useState("GYGI Student");
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [customCountry, setCustomCountry] = useState("");
  const [flag, setFlag] = useState("🇳🇬");
  const [rating, setRating] = useState(5);
  const [countryPreset, setCountryPreset] = useState("Nigeria");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/testimonials/mine");
      const mine = data.data?.testimonial as Mine | null;
      const fetchedRole =
        (data.data?.programRole as string | undefined) ||
        mine?.role ||
        "GYGI Student";
      setProgramRole(fetchedRole);
      setExisting(mine);
      if (mine) {
        setBody(mine.body || "");
        setFlag(mine.flag || "🌍");
        setRating(mine.rating || 5);
        const known = FLAG_OPTIONS.find((o) => o.country === mine.country);
        if (known) {
          setCountryPreset(known.country);
          setCountry(known.country);
          setCustomCountry("");
        } else {
          setCountryPreset("Other");
          setCountry(mine.country || "");
          setCustomCountry(mine.country || "");
        }
      }
    } catch {
      toast.error("Could not load your testimonial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCountryPick = (value: string) => {
    setCountryPreset(value);
    const opt = FLAG_OPTIONS.find((o) => o.country === value);
    if (opt && value !== "Other") {
      setCountry(value);
      setFlag(opt.flag);
    } else {
      setFlag("🌍");
      setCountry(customCountry || "Other");
    }
  };

  const submit = async () => {
    const resolvedCountry =
      countryPreset === "Other" ? customCountry.trim() : country.trim();
    if (body.trim().length < 20) {
      toast.error("Please write at least a short paragraph");
      return;
    }
    if (resolvedCountry.length < 2) {
      toast.error("Add your country");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/testimonials/mine", {
        body: body.trim(),
        country: resolvedCountry,
        flag,
        rating,
      });
      const saved = data.data?.testimonial as Mine | null;
      setExisting(saved);
      if (saved?.role) setProgramRole(saved.role);
      toast.success("Your testimonial is live on the home page!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not save testimonial");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Student · Impact
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Share your GYGI story
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your testimonial appears in the public Testimonials section on{" "}
          <a
            href="https://gygi.org/#testimonials"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            gygi.org
          </a>
          .
        </p>
      </div>

      {existing ? (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
          Your story is live
          {existing.status === "approved" ? "" : ` (${existing.status})`}. You
          can update it anytime — changes replace your previous card.
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#F7F5FB] p-4">
          <Quote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {user?.name || "Student"}
            </p>
            <p className="text-xs text-slate-500">
              Shown as the author on your public card
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role">Program / role</Label>
            <Input
              id="role"
              value={programRole}
              readOnly
              className="rounded-xl bg-slate-50 text-slate-700"
            />
            <p className="text-[11px] text-slate-400">
              Taken from your enrolled program automatically
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={countryPreset}
                onChange={(e) => onCountryPick(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                {FLAG_OPTIONS.map((o) => (
                  <option key={o.country} value={o.country}>
                    {o.flag} {o.country}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex h-10 items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="rounded-lg p-1 transition hover:bg-amber-50"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        n <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {countryPreset === "Other" ? (
            <div className="space-y-1.5">
              <Label htmlFor="country-custom">Your country name</Label>
              <Input
                id="country-custom"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                placeholder="Country"
                className="rounded-xl"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="body">Your story</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you learn? How has GYGI helped you?"
              rows={6}
              className="min-h-36 resize-y rounded-xl"
              maxLength={1000}
            />
            <p className="text-[11px] text-slate-400">
              {body.trim().length}/1000 · minimum 20 characters
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              className="rounded-full"
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving
                ? "Publishing…"
                : existing
                  ? "Update my testimonial"
                  : "Publish to home page"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              asChild
            >
              <Link to="/#testimonials" target="_blank">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View home section
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
