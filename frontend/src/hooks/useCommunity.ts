import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { community, communityMessage, channel, user } from "@/types";

export const useCommunity = (categoryId?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const channelFromUrl = searchParams.get("channel");

  const [community, setCommunity] = useState<community | null>(null);
  const [messages, setMessages] = useState<communityMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<channel | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [canPostMap, setCanPostMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<communityMessage | null>(null);
  const socketRef = useRef(getSocket());
  const activeChannelIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChannelIdRef.current = activeChannel?._id || null;
  }, [activeChannel?._id]);

  const selectChannel = useCallback(
    (ch: channel | null) => {
      setActiveChannel(ch);
      if (ch?._id) {
        setUnreadCounts((prev) => ({ ...prev, [ch._id]: 0 }));
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("channel", ch._id);
            return next;
          },
          { replace: true },
        );
      }
    },
    [setSearchParams],
  );

  const fetchCommunity = useCallback(async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/communities/category/${categoryId}`);
      const next = data.data.community as community & {
        unreadCounts?: Record<string, number>;
        canPost?: Record<string, boolean>;
      };
      setCommunity(next);
      setUnreadCounts(next.unreadCounts || {});
      setCanPostMap(next.canPost || {});

      if (next.channels?.length > 0) {
        const fromUrl = channelFromUrl
          ? next.channels.find((c) => c._id === channelFromUrl)
          : null;
        const preferred =
          fromUrl ||
          next.channels.find((c) => c.type === "general") ||
          next.channels[0];
        setActiveChannel((prev) => {
          if (
            !fromUrl &&
            prev &&
            next.channels.some((c) => c._id === prev._id)
          ) {
            return next.channels.find((c) => c._id === prev._id) || preferred;
          }
          return preferred;
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [categoryId, channelFromUrl]);

  const fetchMessages = useCallback(
    async (channelId: string) => {
      if (!community) return;

      try {
        const { data } = await api.get(
          `/communities/${community._id}/channels/${channelId}/messages`,
        );
        setMessages(data.data.messages);
        setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load messages");
      }
    },
    [community],
  );

  const sendMessage = useCallback(
    async (content: string, attachments: string[] = []) => {
      if (!community || !activeChannel) return;
      if (!content.trim() && attachments.length === 0) return;

      try {
        const { data } = await api.post(
          `/communities/${community._id}/channels/${activeChannel._id}/messages`,
          {
            content: content.trim() || (attachments.length ? "📎 Shared a file" : ""),
            attachments,
            replyTo: replyTo?._id,
          },
        );
        setMessages((prev) => [...prev, data.data.message]);
        setReplyTo(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to send message");
        throw err;
      }
    },
    [community, activeChannel, replyTo],
  );
  const patchMessage = useCallback((updated: communityMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)),
    );
  }, []);

  const removeMessageLocal = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const pinMessage = useCallback(
    async (messageId: string) => {
      const { data } = await api.put(`/communities/messages/${messageId}/pin`);
      patchMessage(data.data.message);
    },
    [patchMessage],
  );

  const starMessage = useCallback(
    async (messageId: string) => {
      const { data } = await api.put(`/communities/messages/${messageId}/star`);
      patchMessage(data.data.message);
    },
    [patchMessage],
  );

  const reactMessage = useCallback(
    async (messageId: string, emoji: string) => {
      const { data } = await api.post(
        `/communities/messages/${messageId}/react`,
        { emoji },
      );
      patchMessage(data.data.message);
    },
    [patchMessage],
  );

  const deleteMessage = useCallback(
    async (messageId: string, scope: "me" | "everyone" = "me") => {
      await api.delete(`/communities/messages/${messageId}`, {
        params: { scope },
      });
      removeMessageLocal(messageId);
    },
    [removeMessageLocal],
  );

  const reportMessage = useCallback(
    async (messageId: string, reason: string) => {
      const { data } = await api.post(
        `/communities/messages/${messageId}/report`,
        { reason },
      );
      patchMessage(data.data.message);
    },
    [patchMessage],
  );

  const openDmWith = useCallback(
    async (userId: string) => {
      if (!community) return null;
      const { data } = await api.post(`/communities/${community._id}/dms`, {
        userId,
      });
      const channel = data.data.channel as channel;
      setCommunity((prev) => {
        if (!prev) return prev;
        const exists = prev.channels.some((c) => c._id === channel._id);
        return exists
          ? prev
          : { ...prev, channels: [...prev.channels, channel] };
      });
      setCanPostMap((prev) => ({ ...prev, [channel._id]: true }));
      selectChannel(channel);
      return channel;
    },
    [community, selectChannel],
  );

  const replyPrivately = useCallback(
    async (messageId: string) => {
      const { data } = await api.post(
        `/communities/messages/${messageId}/reply-private`,
        {},
      );
      const channel = data.data.channel as channel;
      setCommunity((prev) => {
        if (!prev) return prev;
        const exists = prev.channels.some((c) => c._id === channel._id);
        return exists
          ? prev
          : { ...prev, channels: [...prev.channels, channel] };
      });
      setCanPostMap((prev) => ({ ...prev, [channel._id]: true }));
      selectChannel(channel);
      if (data.data.message) {
        setMessages([data.data.message]);
      }
    },
    [selectChannel],
  );

  const forwardMessage = useCallback(
    async (messageId: string, toUserId: string) => {
      const { data } = await api.post(
        `/communities/messages/${messageId}/forward`,
        { toUserId },
      );
      const channel = data.data.channel as channel;
      setCommunity((prev) => {
        if (!prev) return prev;
        const exists = prev.channels.some((c) => c._id === channel._id);
        return exists
          ? prev
          : { ...prev, channels: [...prev.channels, channel] };
      });
      setCanPostMap((prev) => ({ ...prev, [channel._id]: true }));
      selectChannel(channel);
      if (data.data.message) {
        setMessages([data.data.message]);
      }
    },
    [selectChannel],
  );

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel._id);
    }
  }, [activeChannel, fetchMessages]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !categoryId) return;

    socket.emit("join-community", { categoryId });

    const onNew = (message: any) => {
      const incomingChannel = String(message.channelId || message.channel || "");
      if (!incomingChannel) return;

      if (activeChannelIdRef.current === incomingChannel) {
        setMessages((prev) => {
          const id = String(message._id || message.messageId || "");
          if (id && prev.some((m) => String(m._id) === id)) return prev;
          return [...prev, message];
        });
        if (community?._id) {
          void api.put(
            `/communities/${community._id}/channels/${incomingChannel}/read`,
          );
        }
        return;
      }

      // Unread badge bump for other chats (WhatsApp-style message count)
      setUnreadCounts((prev) => ({
        ...prev,
        [incomingChannel]: (prev[incomingChannel] || 0) + 1,
      }));
    };

    socket.on("new-community-message", onNew);

    return () => {
      socket.emit("leave-community", { categoryId });
      socket.off("new-community-message", onNew);
    };
  }, [categoryId, community?._id]);

  const members = (community?.members || []) as user[];
  const isAdmin = Boolean((community as any)?.isAdmin);
  const canPost = activeChannel
    ? canPostMap[activeChannel._id] !== false
    : true;

  return {
    community,
    messages,
    activeChannel,
    setActiveChannel: selectChannel,
    unreadCounts,
    canPost,
    loading,
    error,
    replyTo,
    setReplyTo,
    members,
    isAdmin,
    fetchCommunity,
    fetchMessages,
    sendMessage,
    pinMessage,
    starMessage,
    reactMessage,
    deleteMessage,
    reportMessage,
    replyPrivately,
    forwardMessage,
    openDmWith,
  };
};
