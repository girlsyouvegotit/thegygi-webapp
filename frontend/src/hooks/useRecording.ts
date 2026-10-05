import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { recording, chapter, practiceQuestion } from "@/types";
import type { ClassInteractionMessage } from "@/components/recordings/ClassInteractions";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface TranscriptSearchResult {
  timestamp: string;
  snippet: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useRecording = (recordingId?: string) => {
  const [recording, setRecording] = useState<recording | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [chapters, setChapters] = useState<chapter[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [aiNotes, setAiNotes] = useState<string>("");
  const [practiceQuestions, setPracticeQuestions] = useState<
    practiceQuestion[]
  >([]);
  const [interactions, setInteractions] = useState<ClassInteractionMessage[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecording = useCallback(async () => {
    if (!recordingId) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/recordings/${recordingId}`);
      setRecording(data.data.recording as recording);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load recording"));
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  const fetchPlaybackUrl = useCallback(async () => {
    if (!recordingId) return;

    try {
      const { data } = await api.get(`/recordings/${recordingId}/play`);
      setPlaybackUrl(data.data.playbackUrl as string);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to get playback URL"));
    }
  }, [recordingId]);

  const fetchTranscript = useCallback(async () => {
    if (!recordingId) return;

    try {
      const { data } = await api.get(`/recordings/${recordingId}/transcript`);
      setTranscript((data.data.transcript as string) || "");
      setChapters((data.data.chapters as chapter[]) || []);
      setSummary((data.data.summary as string) || "");
      setAiNotes((data.data.aiNotes as string) || "");
      setPracticeQuestions(
        (data.data.practiceQuestions as practiceQuestion[]) || [],
      );
    } catch {
      // Transcript might not be ready - this is expected
      setTranscript("");
      setChapters([]);
      setSummary("");
      setAiNotes("");
      setPracticeQuestions([]);
    }
  }, [recordingId]);

  const fetchInteractions = useCallback(async () => {
    if (!recordingId) return;

    try {
      const { data } = await api.get(`/recordings/${recordingId}/chat`);
      setInteractions(
        (data.data.messages as ClassInteractionMessage[]) || [],
      );
    } catch {
      setInteractions([]);
    }
  }, [recordingId]);

  const searchTranscript = useCallback(
    async (query: string): Promise<TranscriptSearchResult[]> => {
      if (!recordingId) return [];

      try {
        const { data } = await api.get(
          `/recordings/${recordingId}/search?q=${encodeURIComponent(query)}`,
        );
        return data.data.results as TranscriptSearchResult[];
      } catch {
        return [];
      }
    },
    [recordingId],
  );

  useEffect(() => {
    fetchRecording();
    fetchPlaybackUrl();
    fetchTranscript();
    fetchInteractions();
  }, [fetchRecording, fetchPlaybackUrl, fetchTranscript, fetchInteractions]);

  return {
    recording,
    playbackUrl,
    transcript,
    chapters,
    summary,
    aiNotes,
    practiceQuestions,
    interactions,
    loading,
    error,
    fetchRecording,
    fetchPlaybackUrl,
    fetchTranscript,
    fetchInteractions,
    searchTranscript,
  };
};
