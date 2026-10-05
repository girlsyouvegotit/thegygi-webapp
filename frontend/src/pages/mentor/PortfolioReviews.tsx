import { useCallback, useEffect, useState } from "react";
import { Briefcase, ExternalLink} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";

type QueueItem = {
  _id: string;
  title: string;
  url: string;
  notes?: string;
  status: string;
  student?: { name?: string; email?: string } | null;
  category?: { name?: string } | null;
};

export default function MentorPortfolioReviews() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/post-program/portfolio/queue");
      setItems((data.data?.reviews || []) as QueueItem[]);
    } catch {
      toast.error("Could not load portfolio queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: "reviewed" | "needs_changes") => {
    const body = (feedback[id] || "").trim();
    if (body.length < 2) {
      toast.error("Write feedback first");
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/post-program/portfolio/${id}/review`, {
        status,
        feedback: body,
      });
      toast.success("Feedback sent");
      setFeedback((prev) => ({ ...prev, [id]: "" }));
      await load();
    } catch {
      toast.error("Could not send feedback");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-primary/70 uppercase">
          Mentor · Alumni support
        </p>
        <h1 className="text-2xl font-black text-slate-900">Portfolio reviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review graduate portfolio submissions and send clear feedback.
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item._id}
            className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <p className="text-sm font-black text-slate-900">{item.title}</p>
            </div>
            <p className="text-xs text-slate-500">
              {item.student?.name || "Student"}
              {item.category?.name ? ` · ${item.category.name}` : ""}
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Open portfolio
              <ExternalLink className="h-3 w-3" />
            </a>
            {item.notes ? (
              <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
            ) : null}
            <Textarea
              className="mt-3 min-h-20 rounded-xl"
              placeholder="Write feedback…"
              value={feedback[item._id] || ""}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, [item._id]: e.target.value }))
              }
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={busyId === item._id}
                onClick={() => void review(item._id, "reviewed")}
              >
                Approve / reviewed
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busyId === item._id}
                onClick={() => void review(item._id, "needs_changes")}
              >
                Needs changes
              </Button>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="rounded-[1.5rem] border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
            No portfolio submissions waiting
          </li>
        ) : null}
      </ul>
    </div>
  );
}
