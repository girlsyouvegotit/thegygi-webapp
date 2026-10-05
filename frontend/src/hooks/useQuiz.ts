import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { quiz, quizSubmission } from "@/types";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useQuiz = (quizId?: string) => {
  const [quiz, setQuiz] = useState<quiz | null>(null);
  const [quizzes, setQuizzes] = useState<quiz[]>([]);
  const [submission, setSubmission] = useState<quizSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async () => {
    if (!quizId) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/quizzes/${quizId}`);
      setQuiz(data.data.quiz as quiz);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load quiz"));
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  const fetchQuizzes = useCallback(async (categoryId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = categoryId ? `/quizzes/category/${categoryId}` : "/quizzes";
      const { data } = await api.get(url);
      setQuizzes(data.data.quizzes as quiz[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load quizzes"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResult = useCallback(async () => {
    if (!quizId) return;

    try {
      const { data } = await api.get(`/quizzes/${quizId}/result`);
      setSubmission(data.data.submission as quizSubmission);
    } catch {
      // No submission yet - this is expected
      setSubmission(null);
    }
  }, [quizId]);

  const submitQuiz = useCallback(
    async (answers: QuizAnswer[]): Promise<quizSubmission> => {
      if (!quizId) {
        throw new Error("Quiz ID is required");
      }

      try {
        const { data } = await api.post(`/quizzes/${quizId}/submit`, {
          answers,
        });
        const newSubmission = data.data.submission as quizSubmission;
        setSubmission(newSubmission);
        return newSubmission;
      } catch (err: unknown) {
        throw new Error(getErrorMessage(err, "Failed to submit quiz"));
      }
    },
    [quizId],
  );

  useEffect(() => {
    fetchQuiz();
    fetchResult();
  }, [fetchQuiz, fetchResult]);

  return {
    quiz,
    quizzes,
    submission,
    loading,
    error,
    fetchQuiz,
    fetchQuizzes,
    fetchResult,
    submitQuiz,
    setSubmission,
  };
};
