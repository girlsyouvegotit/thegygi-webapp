import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import MenteeDetailComponent from "@/components/mentorship/MenteeDetail";
import { useMentorship } from "@/hooks/useMentorship";
import type { user } from "@/types";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";

const MenteeDetail = () => {
  const { id } = useParams();
  const [mentee, setMentee] = useState<user | null>(null);
  const [loading, setLoading] = useState(true);
  const { goals, sessions, feedback, fetchGoals } = useMentorship();

  useEffect(() => {
    const fetchMentee = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        setMentee(data.data.user);
        fetchGoals(id);
      } catch (error) {
        console.error("Failed to load mentee:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentee();
  }, [id]);

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  if (!mentee) {
    return <div className="text-center py-16">Mentee not found</div>;
  }

  return (
    <MenteeDetailComponent
      mentee={mentee}
      goals={goals}
      sessions={sessions}
      feedback={feedback}
    />
  );
};

export default MenteeDetail;