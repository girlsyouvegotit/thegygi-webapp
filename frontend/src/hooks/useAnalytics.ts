import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  studentProgress,
  tutorAnalytics,
  mentorAnalytics,
  adminOverview,
} from "@/types";

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

export const useAnalytics = () => {
  const [studentProgress, setStudentProgress] =
    useState<studentProgress | null>(null);
  const [tutorAnalytics, setTutorAnalytics] = useState<tutorAnalytics | null>(
    null,
  );
  const [mentorAnalytics, setMentorAnalytics] =
    useState<mentorAnalytics | null>(null);
  const [adminOverview, setAdminOverview] = useState<adminOverview | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentProgress = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(
        `/analytics/student/${studentId}/progress`,
      );
      setStudentProgress(data.data.analytics as studentProgress);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load progress"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTutorAnalytics = useCallback(async (tutorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/analytics/tutor/${tutorId}`);
      setTutorAnalytics(data.data.analytics as tutorAnalytics);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMentorAnalytics = useCallback(async (mentorId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/analytics/mentor/${mentorId}`);
      setMentorAnalytics(data.data.analytics as mentorAnalytics);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/analytics/admin/overview");
      setAdminOverview(data.data.overview as adminOverview);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load overview"));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    studentProgress,
    tutorAnalytics,
    mentorAnalytics,
    adminOverview,
    loading,
    error,
    fetchStudentProgress,
    fetchTutorAnalytics,
    fetchMentorAnalytics,
    fetchAdminOverview,
  };
};
