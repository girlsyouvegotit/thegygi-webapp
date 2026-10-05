import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  mentorAssignment,
  mentorshipGoal,
  mentorshipSession,
  mentorFeedback,
  mentorNote,
  user,
} from "@/types";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface CreateGoalData {
  menteeId: string;
  categoryId: string;
  title: string;
  description?: string;
  targetDate: Date;
  milestones?: Array<{ title: string }>;
}

interface CreateSessionData {
  menteeId: string;
  categoryId: string;
  topic: string;
  description?: string;
  scheduledDate: Date;
  duration: number;
  type: "one_on_one" | "group";
}

interface CreateFeedbackData {
  menteeId: string;
  categoryId: string;
  projectTitle: string;
  technicalSkills: number;
  uiUx?: number;
  problemSolving?: number;
  communication?: number;
  overall: number;
  feedback: string;
  recommendations?: string[];
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useMentorship = () => {
  const [myMentor, setMyMentor] = useState<user | null>(null);
  const [myMentees, setMyMentees] = useState<mentorAssignment[]>([]);
  const [goals, setGoals] = useState<mentorshipGoal[]>([]);
  const [sessions, setSessions] = useState<mentorshipSession[]>([]);
  const [feedback, setFeedback] = useState<mentorFeedback[]>([]);
  const [notes] = useState<mentorNote[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyMentor = useCallback(async () => {
    try {
      const { data } = await api.get("/mentorship/my-mentor");
      setMyMentor(data.data.mentor as user | null);
    } catch {
      // No mentor assigned - this is expected
      setMyMentor(null);
    }
  }, []);

  const fetchMyMentees = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/mentorship/my-mentees");
      setMyMentees(data.data.assignments as mentorAssignment[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load mentees"));
    }
  }, []);

  const fetchGoals = useCallback(async (menteeId?: string) => {
    if (!menteeId) return;

    setError(null);
    try {
      const { data } = await api.get(`/mentorship/goals/mentee/${menteeId}`);
      setGoals(data.data.goals as mentorshipGoal[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load goals"));
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/mentorship/sessions/my");
      setSessions(data.data.sessions as mentorshipSession[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load sessions"));
    }
  }, []);

  const createGoal = useCallback(
    async (goalData: CreateGoalData): Promise<mentorshipGoal> => {
      try {
        const { data } = await api.post("/mentorship/goals", goalData);
        const newGoal = data.data.goal as mentorshipGoal;
        setGoals((prev) => [...prev, newGoal]);
        return newGoal;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to create goal"));
      }
    },
    [],
  );

  const createSession = useCallback(
    async (sessionData: CreateSessionData): Promise<mentorshipSession> => {
      try {
        const { data } = await api.post("/mentorship/sessions", sessionData);
        const newSession = data.data.session as mentorshipSession;
        setSessions((prev) => [...prev, newSession]);
        return newSession;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to create session"));
      }
    },
    [],
  );

  const createFeedback = useCallback(
    async (feedbackData: CreateFeedbackData): Promise<mentorFeedback> => {
      try {
        const { data } = await api.post("/mentorship/feedback", feedbackData);
        const newFeedback = data.data.feedback as mentorFeedback;
        setFeedback((prev) => [...prev, newFeedback]);
        return newFeedback;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to create feedback"));
      }
    },
    [],
  );

  useEffect(() => {
    fetchMyMentor();
    fetchMyMentees();
    fetchSessions();
  }, [fetchMyMentor, fetchMyMentees, fetchSessions]);

  return {
    myMentor,
    myMentees,
    goals,
    sessions,
    feedback,
    notes,
    loading,
    error,
    fetchMyMentor,
    fetchMyMentees,
    fetchGoals,
    fetchSessions,
    createGoal,
    createSession,
    createFeedback,
  };
};
