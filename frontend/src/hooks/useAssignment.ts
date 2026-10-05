import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { assignment, assignmentSubmission } from "@/types";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface SubmitAssignmentData {
  submissionType: "file" | "text" | "github_url";
  content: string;
  attachments?: string[];
}

interface GradeSubmissionData {
  score: number;
  feedback?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useAssignment = (assignmentId?: string) => {
  const [assignment, setAssignment] = useState<assignment | null>(null);
  const [assignments, setAssignments] = useState<assignment[]>([]);
  const [submission, setSubmission] = useState<assignmentSubmission | null>(
    null,
  );
  const [submissions, setSubmissions] = useState<assignmentSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/assignments/${assignmentId}`);
      setAssignment(data.data.assignment as assignment);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load assignment"));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  const fetchAssignments = useCallback(async (categoryId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = categoryId
        ? `/assignments/category/${categoryId}`
        : "/assignments";
      const { data } = await api.get(url);
      setAssignments(data.data.assignments as assignment[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load assignments"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMySubmission = useCallback(async () => {
    if (!assignmentId) return;

    try {
      const { data } = await api.get(
        `/assignments/${assignmentId}/my-submission`,
      );
      setSubmission(data.data.submission as assignmentSubmission);
    } catch {
      // No submission yet - this is expected
      setSubmission(null);
    }
  }, [assignmentId]);

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return;

    try {
      const { data } = await api.get(
        `/assignments/${assignmentId}/submissions`,
      );
      setSubmissions(data.data.submissions as assignmentSubmission[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load submissions"));
    }
  }, [assignmentId]);

  const submitAssignment = useCallback(
    async (
      submissionData: SubmitAssignmentData,
    ): Promise<assignmentSubmission> => {
      if (!assignmentId) {
        throw new Error("Assignment ID is required");
      }

      try {
        const { data } = await api.post(
          `/assignments/${assignmentId}/submit`,
          submissionData,
        );
        const newSubmission = data.data.submission as assignmentSubmission;
        setSubmission(newSubmission);
        return newSubmission;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to submit assignment"));
      }
    },
    [assignmentId],
  );

  const gradeSubmission = useCallback(
    async (
      submissionId: string,
      gradeData: GradeSubmissionData,
    ): Promise<assignmentSubmission> => {
      try {
        const { data } = await api.post(
          `/assignments/submissions/${submissionId}/grade`,
          gradeData,
        );
        return data.data.submission as assignmentSubmission;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to grade submission"));
      }
    },
    [],
  );

  useEffect(() => {
    fetchAssignment();
    fetchMySubmission();
  }, [fetchAssignment, fetchMySubmission]);

  return {
    assignment,
    assignments,
    submission,
    submissions,
    loading,
    error,
    fetchAssignment,
    fetchAssignments,
    fetchMySubmission,
    fetchSubmissions,
    submitAssignment,
    gradeSubmission,
  };
};
