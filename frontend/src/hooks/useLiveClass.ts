import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { liveClass, liveSession } from "@/types";

export const useLiveClass = (classId?: string) => {
  const [liveClass, setLiveClass] = useState<liveClass | null>(null);
  const [session, setSession] = useState<liveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const fetchClass = useCallback(async () => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/classes/${classId}`);
      setLiveClass(data.data.class);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const fetchSession = useCallback(async () => {
    if (!classId) return;
    
    try {
      const { data } = await api.get(`/classes/${classId}/session`);
      setSession(data.data.session);
      setParticipants(data.data.session.participants || []);
    } catch (err: any) {
      // Session might not exist yet
    }
  }, [classId]);

  const startClass = useCallback(async () => {
    if (!classId) return;
    
    try {
      const { data } = await api.post(`/classes/${classId}/start`);
      setSession(data.data.session);
      return data.data.session;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start class");
      throw err;
    }
  }, [classId]);

  const endClass = useCallback(async () => {
    if (!classId) return;
    
    try {
      await api.post(`/classes/${classId}/end`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to end class");
      throw err;
    }
  }, [classId]);

  const joinClass = useCallback(async () => {
    if (!classId) return;
    
    try {
      await api.post(`/classes/${classId}/join`);
      // Join socket room
      const socket = getSocket();
      if (socket && session) {
        socket.emit("join-class", { sessionId: session._id });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join class");
      throw err;
    }
  }, [classId, session]);

  const leaveClass = useCallback(async () => {
    if (!classId) return;
    
    try {
      await api.post(`/classes/${classId}/leave`);
      const socket = getSocket();
      if (socket && session) {
        socket.emit("leave-class", { sessionId: session._id });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to leave class");
    }
  }, [classId, session]);

  useEffect(() => {
    fetchClass();
    fetchSession();
  }, [fetchClass, fetchSession]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("user-joined", (data) => {
      setParticipants((prev) => [...prev, data]);
    });

    socket.on("user-left", (data) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
    });

    socket.on("new-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("new-message");
    };
  }, []);

  return {
    liveClass,
    session,
    loading,
    error,
    participants,
    messages,
    fetchClass,
    fetchSession,
    startClass,
    endClass,
    joinClass,
    leaveClass,
  };
};