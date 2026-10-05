import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { useCommunity } from "@/hooks/useCommunity";
import {
  Users,
  MessageSquare,
  Hash,
  Megaphone,
  BookOpen,
  HeartHandshake,
  Send,
  Search,
  Smile,
  Paperclip,
  Pin,
  Star,
  Shield,
  X,
  Lock,
  MessageCircle,
  CheckCheck,
  Palette,
  ImageIcon,
  FileText,
  Loader2,
  Settings2,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { channel, communityMessage } from "@/types";
import { MessageActions } from "@/components/community/MessageActions";
import type { MessageActionHandlers } from "@/components/community/MessageActions";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { assertShareFilesWithinLimit } from "@/lib/fileUploadLimits";
import { ChatPageSkeleton } from "@/components/loading/PageSkeleton";
import { api } from "@/lib/api";
import { getMediaLock, withMediaCacheBust, PHOTO_LOCK_DAYS } from "@/lib/profileMedia";
import {
  COMMUNITY_CHAT_THEMES,
  getCommunityChatTheme,
  themeCssVars,
} from "@/lib/communityChatThemes";

function pickFileUrl(
  file:
    | {
        url?: string;
        ufsUrl?: string;
        name?: string;
        serverData?: { url?: string; name?: string } | null;
      }
    | undefined,
) {
  return {
    url: file?.serverData?.url || file?.ufsUrl || file?.url || "",
    name: file?.serverData?.name || file?.name || "file",
  };
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url);
}

const Community = () => {
  const { user, setUser, refreshUser } = useAuth();
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/enrollments/me");
        const enrollments = (data.data.enrollments || []) as {
          status: string;
          category?: { _id?: string } | string;
        }[];
        const active = enrollments.find((e) => e.status === "active");
        const cat = active?.category;
        const id =
          typeof cat === "string" ? cat : cat?._id || "";
        if (!cancelled && id) setActiveCategoryId(id);
      } catch {
        /* fall back to user.categories[0] */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const categoryId =
    activeCategoryId ||
    user?.categories?.[0]?._id ||
    user?.categories?.[0];
  const {
    community,
    messages,
    activeChannel,
    setActiveChannel,
    loading,
    sendMessage,
    members,
    isAdmin,
    replyTo,
    setReplyTo,
    pinMessage,
    starMessage,
    reactMessage,
    deleteMessage,
    reportMessage,
    replyPrivately,
    forwardMessage,
    openDmWith,
    unreadCounts,
    canPost,
  } = useCommunity(categoryId as string);

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showWallpaperDialog, setShowWallpaperDialog] = useState(false);
  const [wallpaperConfirmOpen, setWallpaperConfirmOpen] = useState(false);
  const [pendingWallpaperUrl, setPendingWallpaperUrl] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [pendingFiles, setPendingFiles] = useState<
    { url: string; name: string }[]
  >([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const myId = String(user?._id || "");

  const theme = useMemo(
    () => getCommunityChatTheme(user?.communityChatTheme),
    [user?.communityChatTheme],
  );

  const wallpaperUrl = useMemo(
    () =>
      withMediaCacheBust(
        user?.communityChatWallpaper,
        user?.communityChatWallpaperUpdatedAt,
      ),
    [user?.communityChatWallpaper, user?.communityChatWallpaperUpdatedAt],
  );

  const wallpaperLock = useMemo(() => {
    if (!user?.communityChatWallpaper) return getMediaLock(null);
    if (!user.communityChatWallpaperUpdatedAt) {
      return {
        locked: true,
        daysRemaining: PHOTO_LOCK_DAYS,
        nextChangeAt: null,
      };
    }
    return getMediaLock(user.communityChatWallpaperUpdatedAt);
  }, [user?.communityChatWallpaper, user?.communityChatWallpaperUpdatedAt]);

  const { startUpload: uploadChatFiles, isUploading: uploadingFiles } =
    useUploadThing("chatFileUploader", {
      onUploadError: (error) => {
        toast.error(error.message || "Failed to upload file");
      },
    });

  const { startUpload: uploadWallpaper, isUploading: uploadingWallpaper } =
    useUploadThing("imageUploader", {
      onUploadError: (error) => {
        toast.error(error.message || "Failed to upload wallpaper");
      },
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && pendingFiles.length === 0) || !canPost) return;
    try {
      await sendMessage(
        newMessage,
        pendingFiles.map((f) => f.url),
      );
      setNewMessage("");
      setPendingFiles([]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not send message";
      toast.error(msg);
    }
  }, [newMessage, pendingFiles, sendMessage, canPost]);

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files?.length || !canPost) return;
    const list = Array.from(files).slice(0, 4);
    const sizeCheck = assertShareFilesWithinLimit(list);
    if (!sizeCheck.ok) {
      toast.error(sizeCheck.message);
      return;
    }
    const uploaded = await uploadChatFiles(list);
    const next = (uploaded || [])
      .map(pickFileUrl)
      .filter((f) => Boolean(f.url));
    if (!next.length) {
      toast.error("Upload failed");
      return;
    }
    setPendingFiles((prev) => [...prev, ...next].slice(0, 8));
    toast.success(
      next.length === 1 ? "File attached" : `${next.length} files attached`,
    );
  };

  const persistTheme = async (themeId: string) => {
    setSavingPrefs(true);
    try {
      const { data } = await api.put("/users/profile/chat-theme", {
        theme: themeId,
      });
      if (data?.data?.user) setUser(data.data.user);
      else await refreshUser();
      toast.success("Chat theme updated");
      setShowThemePanel(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not update theme");
    } finally {
      setSavingPrefs(false);
    }
  };

  const beginWallpaperPick = () => {
    if (wallpaperLock.locked) {
      toast.error(
        `Wallpaper locked. You can change it again in ${wallpaperLock.daysRemaining} day${
          wallpaperLock.daysRemaining === 1 ? "" : "s"
        }.`,
      );
      return;
    }
    wallpaperInputRef.current?.click();
  };

  const onWallpaperFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const uploaded = await uploadWallpaper([file]);
    const url = pickFileUrl(uploaded?.[0]).url;
    if (!url) {
      toast.error("Wallpaper upload failed");
      return;
    }
    setPendingWallpaperUrl(url);
    setWallpaperConfirmOpen(true);
  };

  const confirmWallpaper = async () => {
    if (!pendingWallpaperUrl) return;
    setSavingPrefs(true);
    try {
      const { data } = await api.put("/users/profile/chat-wallpaper", {
        wallpaper: pendingWallpaperUrl,
      });
      if (data?.data?.user) setUser(data.data.user);
      else await refreshUser();
      toast.success("Wallpaper set — locked for 30 days");
      setWallpaperConfirmOpen(false);
      setShowWallpaperDialog(false);
      setPendingWallpaperUrl("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not set wallpaper");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return <ChatPageSkeleton />;
  }

  if (!community) {
    return (
      <div className="text-center py-16">
        <Users className="w-10 h-10 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-black text-[#2D2D44]">No Community</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You are not enrolled in any category yet
        </p>
      </div>
    );
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "announcements":
        return <Megaphone className="w-4 h-4" />;
      case "learning":
        return <BookOpen className="w-4 h-4" />;
      case "mentorship":
        return <HeartHandshake className="w-4 h-4" />;
      case "alumni":
        return <GraduationCap className="w-4 h-4" />;
      case "self":
        return <Lock className="w-4 h-4" />;
      case "dm":
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const publicChannels = community.channels.filter(
    (c) => c.type !== "self" && c.type !== "dm",
  );
  const privateChannels = community.channels.filter((c) => c.type === "self");
  const dmChannels = community.channels.filter((c) => c.type === "dm");

  const actionHandlers: MessageActionHandlers = {
    isAdmin,
    currentUserId: myId,
    members,
    onPin: pinMessage,
    onStar: starMessage,
    onReact: reactMessage,
    onDeleteMe: (id) => deleteMessage(id, "me"),
    onDeleteEveryone: (id) => deleteMessage(id, "everyone"),
    onReport: reportMessage,
    onReplyPrivate: replyPrivately,
    onForward: forwardMessage,
    onQuoteReply: setReplyTo,
  };

  const filteredMessages = searchQuery
    ? messages.filter(
        (msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  });

  const emojis = ["😊", "👍", "🎉", "❤️", "🔥", "💡", "🙌", "✨", "🚀", "💪"];

  const postDisabledReason = (() => {
    if (canPost) return null;
    const t = activeChannel?.type;
    if (t === "announcements") return "Only community admins can post here";
    if (t === "mentorship") return "Only mentors can post here";
    if (t === "alumni") return "Alumni channel is for program graduates";
    if (t === "learning") return "Only students and tutors can post here";
    return "You cannot post in this channel";
  })();

  const UnreadBadge = ({ id }: { id: string }) => {
    const n = unreadCounts[id] || 0;
    if (n <= 0) return null;
    return (
      <span
        className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
        style={{ background: "var(--chat-accent)" }}
      >
        {n > 99 ? "99+" : n}
      </span>
    );
  };

  const ChannelButton = ({ channel }: { channel: channel }) => {
    const active = activeChannel?._id === channel._id;
    return (
      <button
        type="button"
        onClick={() => setActiveChannel(channel)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all relative",
          !active && "text-slate-700 hover:bg-black/5",
        )}
        style={
          active
            ? {
                background: "var(--chat-channel-active)",
                color: "var(--chat-channel-active-text)",
                fontWeight: 600,
              }
            : undefined
        }
      >
        {channel.type === "dm" ? (
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/15">
            <AvatarImage src={channel.peer?.avatar} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {channel.peer?.name?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="shrink-0 p-2 rounded-xl bg-primary/10 text-primary">
            {getChannelIcon(channel.type)}
          </span>
        )}
        <span className="flex-1 text-left truncate capitalize min-w-0">
          {channel.name}
        </span>
        <UnreadBadge id={channel._id} />
      </button>
    );
  };

  return (
    <div className="space-y-4" style={themeCssVars(theme)}>
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#2D2D44]">Community</h1>
          <p className="text-sm text-muted-foreground">
            {community.category?.name} · GYGI group chat
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary text-xs px-3 py-1">
            <Users className="w-3 h-3 mr-1" />
            {members.length} members
          </Badge>
          {isAdmin ? (
            <Badge className="bg-[#2D2D44] text-white text-xs px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowThemePanel(true)}
          >
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            Theme
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowWallpaperDialog(true)}
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Wallpaper
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[min(78vh,720px)]">
        <div className="md:col-span-4 lg:col-span-3 flex flex-col rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div
            className="border-b px-4 py-4 sm:px-5 sm:py-5"
            style={{ background: "var(--chat-panel)" }}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/25">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Channels
              </p>
              <div className="space-y-0.5">
                {publicChannels.map((ch) => (
                  <ChannelButton key={ch._id} channel={ch} />
                ))}
              </div>
            </div>

            {privateChannels.length > 0 ? (
              <div>
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Private
                </p>
                {privateChannels.map((ch) => (
                  <ChannelButton key={ch._id} channel={ch} />
                ))}
              </div>
            ) : null}

            {dmChannels.length > 0 ? (
              <div>
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Direct
                </p>
                {dmChannels.map((ch) => (
                  <ChannelButton key={ch._id} channel={ch} />
                ))}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-[#F7F6FA] p-2">
              <div className="flex items-center justify-between px-1 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Members
                </p>
                <button
                  type="button"
                  onClick={() => setShowMembersPanel(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="flex -space-x-2 px-1 pb-1">
                {members.slice(0, 6).map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    title={member.name}
                    onClick={() => {
                      if (String(member._id) === myId) return;
                      void openDmWith(String(member._id));
                    }}
                  >
                    <Avatar className="w-8 h-8 border-2 border-white">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {member.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9 flex flex-col rounded-2xl border border-border overflow-hidden shadow-sm">
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{
              background: "var(--chat-header)",
              color: "var(--chat-header-text)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                {getChannelIcon(activeChannel?.type || "general")}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate capitalize">
                  {activeChannel?.name || "Channel"}
                </h3>
                <p className="text-[11px] opacity-75 truncate">
                  {activeChannel?.type === "announcements"
                    ? "Only admins can post"
                    : activeChannel?.type === "mentorship"
                      ? "Only mentors can post"
                      : activeChannel?.type === "learning"
                        ? "Students & tutors can post"
                        : activeChannel?.type === "alumni"
                          ? "Graduates & mentors can post"
                          : activeChannel?.type === "dm"
                            ? "Private chat"
                            : activeChannel?.description ||
                              `${members.length} members`}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={() => setShowThemePanel(true)}
              title="Chat appearance"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-3 py-4 space-y-2 relative"
            style={{
              backgroundColor: "var(--chat-wash)",
              backgroundImage: wallpaperUrl
                ? `linear-gradient(rgba(45,45,68,0.18), rgba(45,45,68,0.18)), url(${wallpaperUrl})`
                : "radial-gradient(rgba(193,71,233,0.08) 1px, transparent 1px)",
              backgroundSize: wallpaperUrl ? "cover" : "18px 18px",
              backgroundPosition: "center",
            }}
          >
            {filteredMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-2xl bg-white/95 px-6 py-5 text-center shadow-sm max-w-xs border border-border">
                  <MessageSquare className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-bold text-[#2D2D44]">
                    No messages yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {postDisabledReason || "Say hello to the group"}
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((message: communityMessage) => {
                const mine =
                  String(message.user?._id || message.user) === myId;
                return (
                  <div
                    key={message._id}
                    className={cn(
                      "group flex w-full",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "relative max-w-[85%] sm:max-w-[72%] rounded-2xl px-3 py-2 shadow-sm border border-black/5",
                        mine ? "rounded-tr-md" : "rounded-tl-md",
                        message.isPinned && "ring-2 ring-primary/30",
                      )}
                      style={{
                        background: mine
                          ? "var(--chat-bubble-mine)"
                          : "var(--chat-bubble-theirs)",
                        color: mine
                          ? "var(--chat-bubble-mine-text)"
                          : "var(--chat-bubble-theirs-text)",
                      }}
                    >
                      {!mine ? (
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span
                            className="text-[12px] font-bold"
                            style={{ color: "var(--chat-accent)" }}
                          >
                            {message.user?.name || "User"}
                          </span>
                          {message.user?.role === "tutor" ? (
                            <span className="text-[9px] font-bold uppercase opacity-70">
                              admin
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {message.forwardedFrom ? (
                        <p
                          className="text-[11px] font-semibold mb-1"
                          style={{ color: "var(--chat-accent)" }}
                        >
                          Forwarded
                        </p>
                      ) : null}

                      {message.replyTo ? (
                        <div
                          className="mb-1.5 rounded-lg border-l-4 bg-black/5 px-2 py-1"
                          style={{ borderColor: "var(--chat-accent)" }}
                        >
                          <p
                            className="text-[10px] font-bold"
                            style={{ color: "var(--chat-accent)" }}
                          >
                            {message.replyTo.user?.name || "Reply"}
                          </p>
                          <p className="text-[11px] opacity-70 line-clamp-2">
                            {message.replyTo.deletedAt
                              ? "Original message deleted"
                              : message.replyTo.content}
                          </p>
                        </div>
                      ) : null}

                      {message.content &&
                      !message.content.startsWith("📎 Shared") ? (
                        <p className="text-[14px] leading-snug whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      ) : message.content?.startsWith("📎") &&
                        !(message.attachments?.length) ? (
                        <p className="text-[14px]">{message.content}</p>
                      ) : null}

                      {message.attachments && message.attachments.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((att, i) =>
                            isImageUrl(att) ? (
                              <a
                                key={`${att}-${i}`}
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden rounded-xl border border-black/10"
                              >
                                <img
                                  src={att}
                                  alt="Shared"
                                  className="max-h-56 w-full object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={`${att}-${i}`}
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold hover:bg-black/10"
                              >
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="truncate">
                                  Shared file {i + 1}
                                </span>
                              </a>
                            ),
                          )}
                        </div>
                      ) : null}

                      {message.reactions && message.reactions.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {message.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() =>
                                void reactMessage(message._id, r.emoji)
                              }
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full bg-white/70 px-1.5 py-0.5 text-xs border",
                                r.reactedByMe
                                  ? "border-primary"
                                  : "border-black/5",
                              )}
                            >
                              {r.emoji}
                              <span className="text-[10px] opacity-60">
                                {r.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-1 flex items-center justify-end gap-1 opacity-70">
                        {message.isPinned ? (
                          <Pin className="w-3 h-3 text-primary" />
                        ) : null}
                        {message.isStarredByMe ? (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        ) : null}
                        <span className="text-[10px]">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine ? (
                          <CheckCheck
                            className="w-3.5 h-3.5"
                            style={{ color: "var(--chat-accent)" }}
                          />
                        ) : null}
                      </div>

                      <div
                        className={cn(
                          "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                          mine ? "-left-10" : "-right-10",
                        )}
                      >
                        <MessageActions
                          message={message}
                          handlers={actionHandlers}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {showEmojiPicker && canPost ? (
            <div
              className="px-3 pb-2"
              style={{ background: "var(--chat-panel)" }}
            >
              <div className="bg-white border border-border rounded-xl p-2 flex gap-1 flex-wrap shadow-sm">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewMessage((prev) => prev + emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-primary/10 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className="px-3 py-2.5 border-t border-border"
            style={{ background: "var(--chat-panel)" }}
          >
            {replyTo ? (
              <div className="mb-2 flex items-start gap-2 rounded-xl bg-white px-3 py-2 border-l-4 border-primary">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-primary">
                    Replying to {replyTo.user?.name || "message"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {replyTo.content}
                  </p>
                </div>
                <button type="button" onClick={() => setReplyTo(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : null}

            {pendingFiles.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingFiles.map((f) => (
                  <div
                    key={f.url}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {isImageUrl(f.url) ? (
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingFiles((prev) =>
                          prev.filter((x) => x.url !== f.url),
                        )
                      }
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {postDisabledReason ? (
              <div className="rounded-xl bg-white px-4 py-3 text-center text-sm text-muted-foreground border border-dashed">
                <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                {postDisabledReason}
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground shrink-0 hover:text-primary"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground shrink-0 hover:text-primary disabled:opacity-50"
                  title="Share file (max 5MB each)"
                  disabled={uploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingFiles ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                  onChange={(e) => {
                    void handleAttachFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder={
                    activeChannel?.type === "dm"
                      ? `Message ${activeChannel.name}`
                      : "Type a message"
                  }
                  className="rounded-full bg-white border-border shadow-sm h-10"
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={
                    (!newMessage.trim() && pendingFiles.length === 0) ||
                    uploadingFiles
                  }
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                  style={{
                    background: "var(--chat-accent)",
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <Dialog open={showMembersPanel} onOpenChange={setShowMembersPanel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Community members ({members.length})</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search members…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filteredMembers.map((member) => {
              const isMe = String(member._id) === myId;
              return (
                <div
                  key={member._id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {member.name}
                      {isMe ? " (you)" : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                  {!isMe ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setShowMembersPanel(false);
                        void openDmWith(String(member._id));
                      }}
                    >
                      Message
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme picker */}
      <Dialog open={showThemePanel} onOpenChange={setShowThemePanel}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat theme</DialogTitle>
            <DialogDescription>
              Pick one of 10 GYGI color themes. Your choice is saved to your
              account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {COMMUNITY_CHAT_THEMES.map((t) => {
              const selected = theme.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={savingPrefs}
                  onClick={() => void persistTheme(t.id)}
                  className={cn(
                    "rounded-2xl border p-2 text-left transition hover:shadow-md",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border",
                  )}
                >
                  <div
                    className="h-10 w-full rounded-xl mb-2"
                    style={{ background: t.swatch }}
                  />
                  <p className="text-[11px] font-bold text-[#2D2D44] leading-tight">
                    {t.name}
                  </p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallpaper */}
      <Dialog open={showWallpaperDialog} onOpenChange={setShowWallpaperDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat wallpaper</DialogTitle>
            <DialogDescription>
              Personalize your community chat background.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> 30-day lock
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              If you add or change a wallpaper, you won’t be able to change it
              again for <strong>{PHOTO_LOCK_DAYS} days</strong>. Choose carefully
              before uploading.
            </p>
          </div>

          {wallpaperUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border h-36 relative">
              <img
                src={wallpaperUrl}
                alt="Current wallpaper"
                className="h-full w-full object-cover"
              />
              {wallpaperLock.locked ? (
                <div className="absolute inset-x-0 bottom-0 bg-[#2D2D44]/80 text-white text-[11px] px-3 py-2">
                  Locked · change again in {wallpaperLock.daysRemaining} day
                  {wallpaperLock.daysRemaining === 1 ? "" : "s"}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-[#F7F6FA] h-36 flex items-center justify-center text-sm text-muted-foreground">
              No wallpaper yet
            </div>
          )}

          <input
            ref={wallpaperInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onWallpaperFile(e.target.files);
              e.target.value = "";
            }}
          />

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setShowWallpaperDialog(false)}
            >
              Close
            </Button>
            <Button
              className="rounded-full"
              disabled={uploadingWallpaper || wallpaperLock.locked}
              onClick={beginWallpaperPick}
            >
              {uploadingWallpaper ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-1.5" />
              )}
              {wallpaperUrl ? "Change wallpaper" : "Add wallpaper"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallpaper confirm (30-day warning) */}
      <Dialog
        open={wallpaperConfirmOpen}
        onOpenChange={(open) => {
          setWallpaperConfirmOpen(open);
          if (!open) setPendingWallpaperUrl("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm wallpaper</DialogTitle>
            <DialogDescription>
              Once you save this wallpaper, you can only change it again after{" "}
              {PHOTO_LOCK_DAYS} days.
            </DialogDescription>
          </DialogHeader>
          {pendingWallpaperUrl ? (
            <img
              src={pendingWallpaperUrl}
              alt="Preview"
              className="h-40 w-full object-cover rounded-2xl border border-border"
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setWallpaperConfirmOpen(false);
                setPendingWallpaperUrl("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-primary"
              disabled={savingPrefs}
              onClick={() => void confirmWallpaper()}
            >
              {savingPrefs ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : null}
              Save — lock for 30 days
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
