import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Counts = {
  total: number;
  student: number;
  live: number;
};

/**
 * Polls admin testimonial list so sidebar badges stay in sync
 * as students publish new stories.
 */
export function useTestimonialSidebarCount(pollMs = 45_000) {
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    student: 0,
    live: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/testimonials");
      const list = (data.data?.testimonials || []) as Array<{
        status?: string;
        student?: string | null;
        studentUser?: unknown;
      }>;
      const student = list.filter((t) => Boolean(t.studentUser || t.student))
        .length;
      const live = list.filter((t) => t.status === "approved").length;
      setCounts({ total: list.length, student, live });
    } catch {
      // Sidebar badge is non-critical — keep last known value.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, pollMs]);

  return counts;
}
