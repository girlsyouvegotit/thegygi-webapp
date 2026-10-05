import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import Community from "../models/community.model.js";
import CommunityMessage from "../models/community-message.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import LiveClass from "../models/live-class.model.js";
import LiveSession from "../models/live-session.model.js";
import Enrollment from "../models/enrollment.model.js";
import {
  getOnlineUserCount,
  getOnlineUserIds,
} from "./presence.store.js";
import mongoose from "mongoose";

export type ActivityTone = "green" | "amber" | "peak";

export interface CommunityPulse {
  activeNow: number;
  socketOnline: number;
  recentlyActive: number;
  liveClassParticipants: number;
  liveClasses: number;
  totalStudents: number;
  mentorMatchRate: number;
  categories: { _id: string; name: string }[];
  onlineAvatars: { _id: string; name: string; avatar: string | null }[];
  topMentors: {
    _id: string;
    name: string;
    avatar: string | null;
    role: string;
    menteeCount: number;
  }[];
  channels: { name: string; type: string; activity: number }[];
  activity: { hour: number; count: number; height: number; tone: ActivityTone }[];
  peakHourLabel: string;
  updatedAt: string;
}

const formatHourLabel = (hour: number): string => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export const getCommunityPulse = async (
  categoryId?: string,
): Promise<CommunityPulse> => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last30m = new Date(now.getTime() - 30 * 60 * 1000);

  const categoryFilter =
    categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? new mongoose.Types.ObjectId(categoryId)
      : null;

  // Resolve communities for optional category filter
  let communityIds: mongoose.Types.ObjectId[] | null = null;
  if (categoryFilter) {
    const communities = await Community.find({
      category: categoryFilter,
      isActive: true,
    }).select("_id");
    communityIds = communities.map((c) => c._id as mongoose.Types.ObjectId);
  }

  const messageMatch: Record<string, unknown> = {
    createdAt: { $gte: last24h },
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };
  if (communityIds) {
    messageMatch.community = { $in: communityIds };
  }

  const enrollmentMatch: Record<string, unknown> = { status: "active" };
  if (categoryFilter) enrollmentMatch.category = categoryFilter;

  const liveClassMatch: Record<string, unknown> = { status: "live" };
  if (categoryFilter) liveClassMatch.category = categoryFilter;

  const liveSessionMatch: Record<string, unknown> = { status: "live" };
  if (categoryFilter) liveSessionMatch.category = categoryFilter;

  const mentorMatch: Record<string, unknown> = { isActive: true };
  if (categoryFilter) mentorMatch.category = categoryFilter;

  const [
    totalStudentsByRole,
    enrolledStudentIds,
    categories,
    recentUsers,
    liveClasses,
    liveSessions,
    mentorAssignments,
    messageHourly,
    channelActivity,
  ] = await Promise.all([
    categoryFilter
      ? Enrollment.distinct("student", enrollmentMatch).then((ids) => ids.length)
      : User.countDocuments({ role: "student", isActive: { $ne: false } }),

    categoryFilter
      ? Promise.resolve([] as mongoose.Types.ObjectId[])
      : Enrollment.distinct("student", { status: "active" }),

    Category.find({ isActive: { $ne: false } }).select("name").sort({ name: 1 }).lean(),

    User.find({
      isActive: { $ne: false },
      lastLoginAt: { $gte: last30m },
    })
      .select("name avatar role")
      .sort({ lastLoginAt: -1 })
      .limit(12)
      .lean(),

    LiveClass.countDocuments(liveClassMatch),

    LiveSession.find(liveSessionMatch)
      .select("participants")
      .lean(),

    MentorAssignment.find(mentorMatch)
      .populate("mentor", "name avatar")
      .populate("category", "name")
      .lean(),

    CommunityMessage.aggregate<{ _id: number; count: number }>([
      { $match: messageMatch },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]),

    CommunityMessage.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      { $match: messageMatch },
      { $group: { _id: "$channel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const totalStudents = Math.max(
    totalStudentsByRole,
    Array.isArray(enrolledStudentIds) ? enrolledStudentIds.length : 0,
  );

  // Live participants currently in sessions (no leftAt)
  let liveClassParticipants = 0;
  for (const session of liveSessions) {
    const active = (session.participants || []).filter((p) => !p.leftAt);
    liveClassParticipants += active.length;
  }

  const socketOnline = getOnlineUserCount();
  const recentlyActive = recentUsers.length;
  const activeNow = Math.max(
    socketOnline,
    recentlyActive,
    liveClassParticipants,
    liveClasses > 0 ? liveClassParticipants || liveClasses : 0,
  );

  // Mentor match rate
  const menteeIds = new Set<string>();
  let totalCapacity = 0;
  let filledSeats = 0;
  for (const a of mentorAssignments) {
    const mentees = (a.mentees || []) as unknown as mongoose.Types.ObjectId[];
    mentees.forEach((id) => menteeIds.add(String(id)));
    totalCapacity += a.maxMentees || 10;
    filledSeats += mentees.length;
  }
  const mentorMatchRate =
    totalCapacity > 0
      ? Math.round((filledSeats / totalCapacity) * 100)
      : totalStudents > 0
        ? Math.round((menteeIds.size / totalStudents) * 100)
        : 0;

  // Top mentors by mentee count
  const topMentors = mentorAssignments
    .map((a) => {
      const mentor = a.mentor as unknown as {
        _id: mongoose.Types.ObjectId;
        name?: string;
        avatar?: string | null;
      } | null;
      const category = a.category as unknown as { name?: string } | null;
      const menteeCount = Array.isArray(a.mentees) ? a.mentees.length : 0;
      if (!mentor?._id) return null;
      return {
        _id: String(mentor._id),
        name: mentor.name || "Mentor",
        avatar: mentor.avatar || null,
        role: category?.name || "Mentor",
        menteeCount,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.menteeCount - a!.menteeCount))
    .slice(0, 5) as CommunityPulse["topMentors"];

  // Online avatars — prefer socket-online users, fall back to recent logins
  const onlineIds = new Set(getOnlineUserIds());
  let onlineAvatars = recentUsers
    .filter((u) => onlineIds.size === 0 || onlineIds.has(String(u._id)))
    .slice(0, 6)
    .map((u) => ({
      _id: String(u._id),
      name: u.name,
      avatar: u.avatar || null,
    }));

  if (onlineAvatars.length < 3 && recentUsers.length > 0) {
    onlineAvatars = recentUsers.slice(0, 6).map((u) => ({
      _id: String(u._id),
      name: u.name,
      avatar: u.avatar || null,
    }));
  }

  // If still empty, show a few active students as soft presence
  if (onlineAvatars.length === 0) {
    const fallback = await User.find({
      role: "student",
      isActive: { $ne: false },
    })
      .select("name avatar")
      .sort({ lastLoginAt: -1, updatedAt: -1 })
      .limit(6)
      .lean();
    onlineAvatars = fallback.map((u) => ({
      _id: String(u._id),
      name: u.name,
      avatar: u.avatar || null,
    }));
  }

  // Channel activity — map channel ObjectIds to names via communities
  const communities = await Community.find(
    communityIds ? { _id: { $in: communityIds } } : { isActive: true },
  )
    .select("channels")
    .lean();

  const channelNameById = new Map<string, { name: string; type: string }>();
  for (const c of communities) {
    for (const ch of c.channels || []) {
      channelNameById.set(String(ch._id), {
        name: ch.name,
        type: ch.type,
      });
    }
  }

  const channelTotals = new Map<string, { name: string; type: string; activity: number }>();
  for (const row of channelActivity) {
    const meta = channelNameById.get(String(row._id));
    const key = meta?.type || meta?.name || String(row._id);
    const existing = channelTotals.get(key);
    if (existing) {
      existing.activity += row.count;
    } else {
      channelTotals.set(key, {
        name: meta?.name || key,
        type: meta?.type || "general",
        activity: row.count,
      });
    }
  }

  // Ensure default channel types show even with 0 activity
  for (const type of ["general", "learning", "mentorship"] as const) {
    if (![...channelTotals.values()].some((c) => c.type === type || c.name === type)) {
      channelTotals.set(type, { name: type, type, activity: 0 });
    }
  }

  const channels = [...channelTotals.values()]
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 4);

  // Build 24-hour activity bars (hours 0–23)
  const countByHour = new Map<number, number>();
  for (const row of messageHourly) {
    countByHour.set(row._id, row.count);
  }
  // Blend in live-class scheduled density as soft floor when messages are sparse
  const maxCount = Math.max(1, ...Array.from(countByHour.values()), 1);

  const activity = Array.from({ length: 24 }, (_, hour) => {
    const count = countByHour.get(hour) || 0;
    const height = Math.max(8, Math.round((count / maxCount) * 100));
    let tone: ActivityTone = "green";
    if (height >= 85) tone = "peak";
    else if (height >= 50) tone = "amber";
    return { hour, count, height, tone };
  });

  const peak = activity.reduce((best, cur) =>
    cur.count > best.count ? cur : best,
  );
  const peakHourLabel = `${formatHourLabel(peak.hour)} WAT`;

  return {
    activeNow,
    socketOnline,
    recentlyActive,
    liveClassParticipants,
    liveClasses,
    totalStudents,
    mentorMatchRate,
    categories: categories.map((c) => ({
      _id: String(c._id),
      name: c.name,
    })),
    onlineAvatars,
    topMentors,
    channels,
    activity,
    peakHourLabel,
    updatedAt: now.toISOString(),
  };
};
