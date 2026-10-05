import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users } from "lucide-react";
import MenteeCard from "@/components/mentorship/MenteeCard";
import type { mentorAssignment, user } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  mentorPageShell,
  mentorPageHeader,
  mentorPageTitle,
  mentorPageSubtitle,
} from "@/lib/mentorPageStyles";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const MyMentees = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<mentorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentorship/my-mentees");
      setAssignments(data.data.assignments as mentorAssignment[]);
    } catch (error: unknown) {
      console.error("Failed to load mentees:", error);
      toast.error(getErrorMessage(error, "Failed to load mentees"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentees();
  }, [fetchMentees]);

  if (loading) {
    return <PageListSkeleton />;
  }

  const allMentees = assignments.flatMap((a) => (a.mentees as user[]) || []);

  return (
    <div className={mentorPageShell}>
      <div className={mentorPageHeader}>
        <div className="min-w-0">
          <h1 className={mentorPageTitle}>My Mentees</h1>
          <p className={mentorPageSubtitle}>
            {allMentees.length} student{allMentees.length === 1 ? "" : "s"}{" "}
            assigned to you
          </p>
        </div>
      </div>

      {allMentees.length === 0 ? (
        <EmptyState
          title="No mentees assigned"
          description="Students will appear here when assigned"
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {allMentees.map((mentee) => (
            <MenteeCard
              key={mentee._id}
              mentee={mentee}
              onView={() => navigate(`/mentor/mentees/${mentee._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMentees;
