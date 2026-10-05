import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { attendance, attendanceSummary } from "@/types";

export const useAttendance = (studentId?: string, classId?: string) => {
  const [attendanceRecords, setAttendanceRecords] = useState<attendance[]>([]);
  const [summary, setSummary] = useState<attendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentAttendance = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/student/${studentId}`);
      setAttendanceRecords(data.data.attendance);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const fetchClassAttendance = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/class/${classId}`);
      setAttendanceRecords(data.data.attendance);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const fetchSummary = useCallback(async () => {
    if (!studentId) return;

    try {
      const { data } = await api.get(`/attendance/summary/${studentId}`);
      setSummary(data.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load summary");
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentAttendance();
    fetchSummary();
  }, [fetchStudentAttendance, fetchSummary]);

  return {
    attendanceRecords,
    summary,
    loading,
    error,
    fetchStudentAttendance,
    fetchClassAttendance,
    fetchSummary,
  };
};
