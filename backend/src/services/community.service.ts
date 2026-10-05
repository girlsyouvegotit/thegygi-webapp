import mongoose from "mongoose";
import Community from "../models/community.model.js";
import CommunityMessage from "../models/community-message.model.js";
import CommunityChannelRead from "../models/community-channel-read.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import type { IChannel, ICommunity } from "../models/community.model.js";
import type { ICommunityMessage } from "../models/community-message.model.js";
import {
  badRequest,
  forbidden,
  notFound,
} from "../middleware/error.middleware.js";
import { createNotification } from "./notification.service.js";
import { sendToUser } from "../sockets/socket.server.js";
import {
  ensureAlumniChannel,
  studentCompletedCategory,
} from "./post-program.service.js";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

const isPlatformAdmin = (role?: string) =>
  role === "admin" || role === "super_admin";

/**
 * Get community by category ID
 */
export const getCommunityByCategory = async (
  categoryId: string,
): Promise<ICommunity | null> => {
  return Community.findOne({ category: categoryId })
    .populate("members", "name email avatar role")
    .populate("category", "name slug");
};

/**
 * Get community by ID
 */
export const getCommunityById = async (
  communityId: string,
): Promise<ICommunity | null> => {
  return Community.findById(communityId)
    .populate("members", "name email avatar role")
    .populate("category", "name slug");
};

/** Category tutors (and platform admins) are WhatsApp-style community admins. */
export const isCommunityAdmin = async (
  communityId: string,
  userId: string,
  role?: string,
): Promise<boolean> => {
  if (role === "admin" || role === "super_admin") return true;

  const community = await Community.findById(communityId).select("category");
  if (!community) return false;

  const category = await Category.findById(community.category)
    .select("tutors")
    .lean();
  if (!category) return false;

  return (category.tutors || []).some((t) => String(t) === String(userId));
};

export const ensurePrivateSelfChannel = async (
  communityId: string,
  userId: string,
): Promise<IChannel | null> => {
  const community = await Community.findById(communityId);
  if (!community) return null;

  const existing = community.channels.find(
    (c) =>
      c.type === "self" && c.owner && String(c.owner) === String(userId),
  );
  if (existing) return existing;

  community.channels.push({
    _id: new mongoose.Types.ObjectId(),
    name: "just me",
    type: "self",
    description: "Private space — only you can see these messages",
    owner: new mongoose.Types.ObjectId(userId),
    createdAt: new Date(),
  } as IChannel);

  await community.save();

  return (
    community.channels.find(
      (c) =>
        c.type === "self" && c.owner && String(c.owner) === String(userId),
    ) || null
  );
};

export const filterChannelsForUser = (
  channels: IChannel[],
  userId: string,
  role?: string,
): IChannel[] => {
  const uid = String(userId);
  const isPlatformAdmin = role === "admin" || role === "super_admin";

  return (channels || []).filter((c) => {
    if (c.type === "self") {
      if (isPlatformAdmin) return true;
      return c.owner && String(c.owner) === uid;
    }
    if (c.type === "dm") {
      return (c.participants || []).some((p) => String(p) === uid);
    }
    return true;
  });
};

const decorateDmChannels = async (
  channels: IChannel[],
  userId: string,
): Promise<any[]> => {
  const uid = String(userId);
  const otherIds = new Set<string>();
  for (const c of channels) {
    if (c.type !== "dm") continue;
    for (const p of c.participants || []) {
      if (String(p) !== uid) otherIds.add(String(p));
    }
  }

  const users = otherIds.size
    ? await User.find({ _id: { $in: [...otherIds] } })
        .select("name avatar role")
        .lean()
    : [];
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return channels.map((c) => {
    const plain = typeof (c as any).toObject === "function" ? (c as any).toObject() : { ...c };
    if (plain.type !== "dm") return plain;
    const otherId = (plain.participants || [])
      .map(String)
      .find((id: string) => id !== uid);
    const other = otherId ? byId.get(otherId) : null;
    return {
      ...plain,
      name: other?.name || "Private chat",
      description: "Private chat — only the two of you",
      peer: other
        ? {
            _id: String(other._id),
            name: other.name,
            avatar: other.avatar,
            role: other.role,
          }
        : null,
    };
  });
};

export const prepareCommunityForUser = async (
  community: ICommunity,
  userId: string,
  role?: string,
): Promise<Record<string, unknown>> => {
  await ensurePrivateSelfChannel(String(community._id), userId);
  const categoryId = String(
    (community.category as { _id?: unknown })?._id || community.category,
  );
  if (categoryId) await ensureAlumniChannel(categoryId);

  const fresh = await getCommunityById(String(community._id));
  if (!fresh) throw notFound("Community not found");

  const plain = fresh.toObject ? fresh.toObject() : (fresh as any);
  const isStaff =
    role === "admin" ||
    role === "super_admin" ||
    role === "tutor" ||
    role === "mentor";
  const isAlumniForCategory = categoryId
    ? await studentCompletedCategory(userId, categoryId)
    : false;

  let filtered = filterChannelsForUser(
    (plain.channels || []) as IChannel[],
    userId,
    role,
  );
  // Alumni channel is only for graduates + staff
  filtered = filtered.filter((c) => {
    if (c.type !== "alumni") return true;
    return isStaff || isAlumniForCategory;
  });
  const channels = await decorateDmChannels(filtered, userId);
  const isAdmin = await isCommunityAdmin(
    String(community._id),
    userId,
    role,
  );

  const unreadCounts = await getUnreadCountsForUser(
    String(community._id),
    userId,
    filtered,
  );

  const canPost: Record<string, boolean> = {};
  for (const ch of filtered) {
    canPost[String(ch._id)] = await canPostToChannel(
      String(community._id),
      ch,
      userId,
      role,
    );
  }

  return {
    ...plain,
    channels,
    isAdmin,
    viewerId: String(userId),
    unreadCounts,
    canPost,
  };
};

export const findChannel = (
  community: { channels?: IChannel[] },
  channelId: string,
): IChannel | undefined =>
  (community.channels || []).find((c) => String(c._id) === String(channelId));

export const assertChannelAccess = (
  channel: IChannel | undefined,
  userId: string,
  role?: string,
): IChannel => {
  if (!channel) throw notFound("Channel not found");

  if (channel.type === "self") {
    const isOwner = channel.owner && String(channel.owner) === String(userId);
    if (!isOwner && !isPlatformAdmin(role)) {
      throw forbidden("This private channel is only visible to you");
    }
  }

  if (channel.type === "dm") {
    const isParticipant = (channel.participants || []).some(
      (p) => String(p) === String(userId),
    );
    if (!isParticipant) {
      throw forbidden("You are not part of this private chat");
    }
  }

  return channel;
};

/**
 * Channel post rules (WhatsApp-group style):
 * - announcements: community admin (category tutors) + org admin + super_admin
 * - mentorship: mentors + org admin + super_admin
 * - learning: students + tutors + org admin + super_admin
 * - general / self / dm: any member with channel access
 */
export const assertCanPostToChannel = async (
  communityId: string,
  channel: IChannel,
  userId: string,
  role?: string,
): Promise<void> => {
  if (isPlatformAdmin(role)) return;

  const type = channel.type;

  if (type === "announcements") {
    const admin = await isCommunityAdmin(communityId, userId, role);
    if (!admin) {
      throw forbidden("Only community admins can post in announcements");
    }
    return;
  }

  if (type === "mentorship") {
    if (role !== "mentor") {
      throw forbidden("Only mentors can post in the mentorship channel");
    }
    return;
  }

  if (type === "learning") {
    if (role !== "student" && role !== "tutor") {
      throw forbidden("Only students and tutors can post in learning");
    }
    return;
  }

  if (type === "alumni") {
    if (role === "mentor" || role === "tutor") return;
    if (role === "student") {
      const community = await Community.findById(communityId)
        .select("category")
        .lean();
      const categoryId = community?.category
        ? String(community.category)
        : "";
      const ok = categoryId
        ? await studentCompletedCategory(userId, categoryId)
        : false;
      if (!ok) {
        throw forbidden("Alumni channel is for program graduates");
      }
      return;
    }
    throw forbidden("Alumni channel is for graduates and mentors");
  }
};

export const canPostToChannel = async (
  communityId: string,
  channel: IChannel,
  userId: string,
  role?: string,
): Promise<boolean> => {
  try {
    await assertCanPostToChannel(communityId, channel, userId, role);
    return true;
  } catch {
    return false;
  }
};

export const getUnreadCountsForUser = async (
  communityId: string,
  userId: string,
  channels: IChannel[],
): Promise<Record<string, number>> => {
  const reads = await CommunityChannelRead.find({
    user: userId,
    community: communityId,
  }).lean();
  const readMap = new Map(
    reads.map((r) => [String(r.channel), new Date(r.lastReadAt)]),
  );

  const counts: Record<string, number> = {};
  await Promise.all(
    channels.map(async (ch) => {
      const channelId = String(ch._id);
      const since = readMap.get(channelId) || new Date(0);
      const count = await CommunityMessage.countDocuments({
        community: communityId,
        channel: channelId,
        deletedAt: null,
        deletedFor: { $ne: userId },
        user: { $ne: userId },
        createdAt: { $gt: since },
      });
      counts[channelId] = count;
    }),
  );
  return counts;
};

export const markChannelRead = async (
  communityId: string,
  channelId: string,
  userId: string,
) => {
  await CommunityChannelRead.findOneAndUpdate(
    { user: userId, community: communityId, channel: channelId },
    { lastReadAt: new Date() },
    { upsert: true, new: true },
  );
  return { channelId, unread: 0 };
};

export const notifyChannelRecipients = async (opts: {
  communityId: string;
  channel: IChannel;
  senderId: string;
  senderName: string;
  content: string;
  messageId: string;
}) => {
  const { communityId, channel, senderId, senderName, content, messageId } =
    opts;
  const preview = content.slice(0, 160);

  let recipientIds: string[] = [];

  if (channel.type === "dm") {
    recipientIds = (channel.participants || [])
      .map(String)
      .filter((id) => id !== String(senderId));
  } else if (channel.type === "announcements") {
    // Announce to all members except sender (counts in notification bell)
    const community = await Community.findById(communityId).select("members");
    recipientIds = (community?.members || [])
      .map(String)
      .filter((id) => id !== String(senderId));
  } else {
    // general / learning / mentorship: unread badges only (no spam notifications)
    return;
  }

  const title =
    channel.type === "dm"
      ? senderName
      : `${senderName} · #${channel.name}`;

  for (const uid of recipientIds) {
    const n = await createNotification({
      user: uid,
      type: "community_mention",
      title,
      message: preview,
      link: undefined,
      metadata: {
        communityId,
        channelId: String(channel._id),
        messageId,
        openCommunityChat: true,
        channelType: channel.type,
      },
      channels: { email: false, push: true, inApp: true },
    });
    if (n) sendToUser(uid, "new-notification", n);
  }
};

const serializeMessage = (message: any, userId: string) => {
  const plain = message.toObject ? message.toObject() : message;
  const uid = String(userId);
  const starredBy = (plain.starredBy || []).map(String);
  const reactions = (plain.reactions || []).map((r: any) => ({
    emoji: r.emoji,
    count: (r.users || []).length,
    reactedByMe: (r.users || []).some((u: any) => String(u) === uid),
    users: (r.users || []).map((u: any) => String(u?._id || u)),
  }));

  return {
    ...plain,
    _id: String(plain._id),
    isStarredByMe: starredBy.includes(uid),
    starCount: starredBy.length,
    reactions,
    reportCount: (plain.reports || []).length,
    reportedByMe: (plain.reports || []).some(
      (r: any) => String(r.user?._id || r.user) === uid,
    ),
  };
};

export const getChannelMessages = async (
  communityId: string,
  channelId: string,
  userId: string,
  limit: number = 50,
  before?: Date,
): Promise<any[]> => {
  const query: any = {
    community: communityId,
    channel: channelId,
    deletedAt: null,
    deletedFor: { $ne: userId },
  };

  if (before) {
    query.createdAt = { $lt: before };
  }

  const messages = await CommunityMessage.find(query)
    .populate("user", "name email avatar role")
    .populate({
      path: "replyTo",
      select: "content user deletedAt",
      populate: { path: "user", select: "name" },
    })
    .sort({ createdAt: -1 })
    .limit(limit);

  return messages.map((m) => serializeMessage(m, userId));
};

export const createMessage = async (
  communityId: string,
  channelId: string,
  userId: string,
  content: string,
  attachments: string[] = [],
  extras?: {
    replyTo?: string;
    forwardedFrom?: {
      messageId?: string;
      userName: string;
      preview: string;
    };
  },
): Promise<any> => {
  const message = await CommunityMessage.create({
    community: communityId,
    channel: channelId,
    user: userId,
    content,
    attachments,
    replyTo: extras?.replyTo || null,
    forwardedFrom: extras?.forwardedFrom || null,
  });

  await message.populate("user", "name email avatar role");
  if (extras?.replyTo) {
    await message.populate({
      path: "replyTo",
      select: "content user deletedAt",
      populate: { path: "user", select: "name" },
    });
  }

  return serializeMessage(message, userId);
};

export const createAnnouncement = async (
  communityId: string,
  channelId: string,
  userId: string,
  content: string,
): Promise<ICommunityMessage> => {
  const message = await CommunityMessage.create({
    community: communityId,
    channel: channelId,
    user: userId,
    content,
    isAnnouncement: true,
    isPinned: true,
  });

  return message.populate("user", "name email avatar role");
};

export const getMessageOrThrow = async (messageId: string) => {
  const message = await CommunityMessage.findById(messageId).populate(
    "user",
    "name email avatar role",
  );
  if (!message || message.deletedAt) throw notFound("Message not found");
  return message;
};

export const assertMemberOfCommunity = async (
  communityId: string,
  userId: string,
  role?: string,
) => {
  if (role === "admin" || role === "super_admin") return;
  const ok = await isCommunityMember(communityId, userId);
  if (!ok) throw forbidden("Not a member of this community");
};

export const pinMessageForAdmin = async (
  messageId: string,
  userId: string,
  role?: string,
) => {
  const message = await getMessageOrThrow(messageId);
  const admin = await isCommunityAdmin(
    String(message.community),
    userId,
    role,
  );
  if (!admin) throw forbidden("Only community admins can pin messages");

  message.isPinned = !message.isPinned;
  await message.save();
  return serializeMessage(message, userId);
};

export const toggleStarMessage = async (messageId: string, userId: string) => {
  const message = await getMessageOrThrow(messageId);
  await assertMemberOfCommunity(String(message.community), userId);

  const uid = new mongoose.Types.ObjectId(userId);
  const has = message.starredBy.some((id) => String(id) === userId);
  if (has) {
    message.starredBy = message.starredBy.filter(
      (id) => String(id) !== userId,
    ) as any;
  } else {
    message.starredBy.push(uid);
  }
  await message.save();
  return serializeMessage(message, userId);
};

export const reactToMessage = async (
  messageId: string,
  userId: string,
  emoji: string,
) => {
  if (!QUICK_REACTIONS.includes(emoji as any) && emoji.length > 8) {
    throw badRequest("Invalid quick reply");
  }

  const message = await getMessageOrThrow(messageId);
  await assertMemberOfCommunity(String(message.community), userId);

  const uid = String(userId);
  let reaction = message.reactions.find((r) => r.emoji === emoji);
  if (!reaction) {
    message.reactions.push({ emoji, users: [new mongoose.Types.ObjectId(userId)] });
  } else {
    const has = reaction.users.some((u) => String(u) === uid);
    if (has) {
      reaction.users = reaction.users.filter((u) => String(u) !== uid) as any;
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter(
          (r) => r.emoji !== emoji,
        ) as any;
      }
    } else {
      reaction.users.push(new mongoose.Types.ObjectId(userId));
    }
  }

  await message.save();
  return serializeMessage(message, userId);
};

export const reportMessage = async (
  messageId: string,
  userId: string,
  reason: string,
) => {
  const text = (reason || "").trim();
  if (!text) throw badRequest("Report reason is required");

  const message = await getMessageOrThrow(messageId);
  await assertMemberOfCommunity(String(message.community), userId);

  if (String(message.user?._id || message.user) === String(userId)) {
    throw badRequest("You cannot report your own message");
  }

  const already = message.reports.some(
    (r) => String(r.user) === String(userId),
  );
  if (already) throw badRequest("You already reported this message");

  message.reports.push({
    user: new mongoose.Types.ObjectId(userId),
    reason: text.slice(0, 500),
    createdAt: new Date(),
  } as any);
  await message.save();

  // Notify community admins (category tutors)
  const community = await Community.findById(message.community).select(
    "category",
  );
  if (community) {
    const category = await Category.findById(community.category)
      .select("tutors name")
      .lean();
    const reporter = await User.findById(userId).select("name").lean();
    for (const tutorId of category?.tutors || []) {
      const n = await createNotification({
        user: String(tutorId),
        type: "announcement",
        title: "Message reported in community",
        message: `${reporter?.name || "A member"} reported a message${
          category?.name ? ` in ${category.name}` : ""
        }: ${text.slice(0, 120)}`,
        metadata: {
          communityId: String(message.community),
          messageId: String(message._id),
          reportReason: text,
        },
      });
      if (n) sendToUser(String(tutorId), "new-notification", n);
    }
  }

  return serializeMessage(message, userId);
};

export const deleteMessageScoped = async (
  messageId: string,
  userId: string,
  scope: "me" | "everyone",
  role?: string,
) => {
  const message = await getMessageOrThrow(messageId);
  const communityId = String(message.community);
  await assertMemberOfCommunity(communityId, userId, role);

  if (scope === "me") {
    if (!message.deletedFor.some((id) => String(id) === userId)) {
      message.deletedFor.push(new mongoose.Types.ObjectId(userId));
      await message.save();
    }
    return { scope: "me" as const, messageId };
  }

  const isAuthor = String(message.user?._id || message.user) === String(userId);
  const admin = await isCommunityAdmin(communityId, userId, role);
  if (!isAuthor && !admin) {
    throw forbidden("Only the author or a community admin can delete for everyone");
  }

  message.deletedAt = new Date();
  await message.save();
  return { scope: "everyone" as const, messageId };
};

/** Get or create a 1:1 DM channel between two community members. */
export const getOrCreateDmChannel = async (
  communityId: string,
  userId: string,
  peerUserId: string,
) => {
  if (String(userId) === String(peerUserId)) {
    throw badRequest("Cannot start a private chat with yourself");
  }

  const community = await Community.findById(communityId);
  if (!community) throw notFound("Community not found");

  const memberIds = (community.members || []).map(String);
  if (!memberIds.includes(String(userId)) || !memberIds.includes(String(peerUserId))) {
    throw forbidden("Both users must be members of this community");
  }

  const existing = community.channels.find((c) => {
    if (c.type !== "dm") return false;
    const parts = (c.participants || []).map(String);
    return (
      parts.length === 2 &&
      parts.includes(String(userId)) &&
      parts.includes(String(peerUserId))
    );
  });

  if (existing) {
    const [decorated] = await decorateDmChannels([existing], userId);
    return decorated;
  }

  const peer = await User.findById(peerUserId).select("name avatar role");
  if (!peer) throw notFound("Member not found");

  community.channels.push({
    _id: new mongoose.Types.ObjectId(),
    name: peer.name || "Private chat",
    type: "dm",
    description: "Private chat — only the two of you",
    participants: [
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(peerUserId),
    ],
    createdAt: new Date(),
  } as IChannel);

  await community.save();

  const created = community.channels.find((c) => {
    if (c.type !== "dm") return false;
    const parts = (c.participants || []).map(String);
    return (
      parts.includes(String(userId)) && parts.includes(String(peerUserId))
    );
  });

  const [decorated] = await decorateDmChannels(
    created ? [created] : [],
    userId,
  );
  return decorated;
};

export const replyPrivately = async (
  messageId: string,
  userId: string,
  content?: string,
) => {
  const message = await getMessageOrThrow(messageId);
  const authorId = String(message.user?._id || message.user);
  if (authorId === String(userId)) {
    throw badRequest("Use the channel to reply to your own message");
  }

  await assertMemberOfCommunity(String(message.community), userId);

  const dm = await getOrCreateDmChannel(
    String(message.community),
    userId,
    authorId,
  );

  let sent: any = null;
  const body =
    (content || "").trim() ||
    `↩︎ Re: "${String(message.content).slice(0, 160)}"`;

  sent = await createMessage(
    String(message.community),
    String(dm._id),
    userId,
    body,
    [],
    {
      replyTo: String(message._id),
      forwardedFrom: undefined,
    },
  );

  // Notify peer
  const sender = await User.findById(userId).select("name").lean();
  const n = await createNotification({
    user: authorId,
    type: "community_mention",
    title: "Private reply in community",
    message: `${sender?.name || "Someone"} replied to you privately`,
    metadata: {
      communityId: String(message.community),
      channelId: String(dm._id),
      openDm: true,
    },
  });
  if (n) sendToUser(authorId, "new-notification", n);

  return { channel: dm, message: sent };
};

export const forwardMessageToMember = async (
  messageId: string,
  userId: string,
  toUserId: string,
) => {
  const message = await getMessageOrThrow(messageId);
  await assertMemberOfCommunity(String(message.community), userId);

  if (String(toUserId) === String(userId)) {
    throw badRequest("Pick another community member to forward to");
  }

  const dm = await getOrCreateDmChannel(
    String(message.community),
    userId,
    toUserId,
  );

  const authorName =
    (message.user as any)?.name || "Community member";

  const sent = await createMessage(
    String(message.community),
    String(dm._id),
    userId,
    message.content,
    message.attachments || [],
    {
      forwardedFrom: {
        messageId: String(message._id),
        userName: authorName,
        preview: String(message.content).slice(0, 200),
      },
    },
  );

  const sender = await User.findById(userId).select("name").lean();
  const n = await createNotification({
    user: toUserId,
    type: "community_mention",
    title: "Forwarded community message",
    message: `${sender?.name || "Someone"} forwarded you a message`,
    metadata: {
      communityId: String(message.community),
      channelId: String(dm._id),
      openDm: true,
    },
  });
  if (n) sendToUser(toUserId, "new-notification", n);

  return { channel: dm, message: sent };
};

/** @deprecated soft delete for everyone — prefer deleteMessageScoped */
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  const message = await CommunityMessage.findByIdAndUpdate(
    messageId,
    { deletedAt: new Date() },
    { new: true },
  );
  return !!message;
};

export const togglePinMessage = async (
  messageId: string,
): Promise<ICommunityMessage | null> => {
  const message = await CommunityMessage.findById(messageId);
  if (!message) return null;
  message.isPinned = !message.isPinned;
  await message.save();
  return message;
};

export const getCommunityMembers = async (
  communityId: string,
): Promise<any[]> => {
  const community = await Community.findById(communityId).populate(
    "members",
    "name email avatar role categories",
  );
  return community?.members || [];
};

export const isCommunityMember = async (
  communityId: string,
  userId: string,
): Promise<boolean> => {
  const community = await Community.findOne({
    _id: communityId,
    members: userId,
  });
  return !!community;
};

export const addMemberToCommunity = async (
  communityId: string,
  userId: string,
): Promise<void> => {
  await Community.findByIdAndUpdate(communityId, {
    $addToSet: { members: userId },
  });
  await ensurePrivateSelfChannel(communityId, userId);
};

export const removeMemberFromCommunity = async (
  communityId: string,
  userId: string,
): Promise<void> => {
  await Community.findByIdAndUpdate(communityId, {
    $pull: { members: userId },
  });
};
