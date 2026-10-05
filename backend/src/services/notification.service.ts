import webpush from "web-push";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import type {
  INotification,
  NotificationType,
} from "../models/notification.model.js";
import { sendEmail } from "./email.service.js";
import { env } from "../config/env.js";
import {
  DEFAULT_NOTIFICATIONS,
  getOrCreatePlatformSettings,
} from "../models/platform-settings.model.js";

export interface CreateNotificationInput {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  /** Skip channel fan-out (in-app only) */
  channels?: { email?: boolean; push?: boolean; inApp?: boolean };
}

const vapidReady = Boolean(env.vapid.publicKey && env.vapid.privateKey);

if (vapidReady) {
  webpush.setVapidDetails(
    env.vapid.subject,
    env.vapid.publicKey,
    env.vapid.privateKey,
  );
}

const eventKeyForType = (type: NotificationType): string => {
  const map: Partial<Record<NotificationType, string>> = {
    class_scheduled: "class_scheduled",
    class_starting: "class_starting",
    recording_available: "recording_available",
    quiz_result: "quiz_result",
    assignment_graded: "assignment_graded",
    mentor_assigned: "mentor_assigned",
    session_reminder: "session_reminder",
    announcement: "platform_announcement",
  };
  return map[type] || type;
};

async function platformAllows(type: NotificationType) {
  try {
    const doc = await getOrCreatePlatformSettings();
    const n = doc.notifications || DEFAULT_NOTIFICATIONS;
    const events =
      n.events instanceof Map
        ? Object.fromEntries(n.events.entries())
        : { ...(n.events || {}) };
    const key = eventKeyForType(type);
    const eventOn =
      events[key] !== undefined
        ? Boolean(events[key])
        : DEFAULT_NOTIFICATIONS.events[key] !== false;
    return {
      email: Boolean(n.emailEnabled) && eventOn,
      inApp: Boolean(n.inAppEnabled) && eventOn,
      push: Boolean(n.pushEnabled) && eventOn,
    };
  } catch {
    return { email: true, inApp: true, push: true };
  }
}

async function deliverEmail(
  to: string,
  title: string,
  message: string,
  link?: string,
) {
  if (!env.email.host || !env.email.user) return;
  const href = link
    ? link.startsWith("http")
      ? link
      : `${env.clientUrl}${link}`
    : env.clientUrl;
  await sendEmail({
    to,
    subject: title,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#2D2D44">${title}</h2>
        <p style="color:#475569;line-height:1.5">${message}</p>
        <p><a href="${href}" style="display:inline-block;padding:10px 16px;background:#c147e9;color:#fff;border-radius:999px;text-decoration:none;font-weight:700">Open GYGI</a></p>
      </div>
    `,
  }).catch((err) => {
    console.warn("[notify] email failed", err?.message || err);
  });
}

async function deliverPush(
  userId: string,
  title: string,
  message: string,
  link?: string,
) {
  if (!vapidReady) return;
  const user = await User.findById(userId).select("pushSubscriptions");
  const subs = user?.pushSubscriptions || [];
  if (!subs.length) return;

  const payload = JSON.stringify({
    title,
    body: message,
    url: link || "/",
  });

  const stale: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          payload,
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          stale.push(sub.endpoint);
        }
      }
    }),
  );

  if (stale.length) {
    await User.updateOne(
      { _id: userId },
      { $pull: { pushSubscriptions: { endpoint: { $in: stale } } } },
    );
  }
}

/**
 * Create a notification and fan out to email / push / in-app
 * based on platform settings + user prefs.
 */
export const createNotification = async (
  input: CreateNotificationInput,
): Promise<INotification | null> => {
  const platform = await platformAllows(input.type);
  const user = await User.findById(input.user)
    .select("email notificationPrefs")
    .lean();
  if (!user) return null;

  const prefs = user.notificationPrefs || {
    email: true,
    inApp: true,
    push: true,
  };

  const wantEmail =
    (input.channels?.email ?? true) && platform.email && prefs.email !== false;
  const wantPush =
    (input.channels?.push ?? true) && platform.push && prefs.push !== false;
  // Always persist in-app record so the app inbox + sockets stay consistent
  const wantInApp = input.channels?.inApp ?? true;

  const notification = await Notification.create({
    user: input.user,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    metadata: {
      ...input.metadata,
      channels: {
        email: wantEmail,
        push: wantPush,
        inApp: wantInApp && platform.inApp && prefs.inApp !== false,
      },
    },
  });

  if (wantEmail && user.email) {
    void deliverEmail(user.email, input.title, input.message, input.link);
  }
  if (wantPush) {
    void deliverPush(input.user, input.title, input.message, input.link);
  }

  return notification;
};

export const createBulkNotifications = async (
  userIds: string[],
  input: Omit<CreateNotificationInput, "user">,
): Promise<INotification[]> => {
  const results: INotification[] = [];
  for (const userId of userIds) {
    const n = await createNotification({ ...input, user: userId });
    if (n && (n as any)._id) results.push(n);
  }
  return results;
};

export const getUserNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
}> => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount };
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
  );
};

export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<void> => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

export const deleteNotification = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  await Notification.findOneAndDelete({ _id: notificationId, user: userId });
};

export const deleteAllNotifications = async (userId: string): Promise<void> => {
  await Notification.deleteMany({ user: userId });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

export const notifyClassScheduled = async (
  categoryId: string,
  studentIds: string[],
  classTitle: string,
  classId: string,
  scheduledDate: Date,
): Promise<void> => {
  await createBulkNotifications(studentIds, {
    type: "class_scheduled",
    title: "New Class Scheduled",
    message: `"${classTitle}" has been scheduled for ${scheduledDate.toLocaleString()}`,
    link: `/classes/${classId}`,
    metadata: { classId, categoryId, scheduledDate },
  });
};

export const notifyRecordingAvailable = async (
  studentIds: string[],
  recordingId: string,
  classTitle: string,
): Promise<void> => {
  await createBulkNotifications(studentIds, {
    type: "recording_available",
    title: "Recording Ready",
    message: `The recording for "${classTitle}" is now available`,
    link: `/recordings/${recordingId}`,
    metadata: { recordingId },
  });
};

export const notifySalaryPaid = async (input: {
  employeeId: string;
  amount: number;
  month?: string | number;
  year?: string | number;
  salaryId?: string;
  link?: string;
}): Promise<INotification | null> => {
  return createNotification({
    user: input.employeeId,
    type: "salary_paid",
    title: "Salary paid",
    message: `Your salary of ₦${Math.round(input.amount).toLocaleString()} has been marked as paid${
      input.month != null ? ` for ${input.month}/${input.year ?? ""}` : ""
    }.`,
    link: input.link || "/finance",
    metadata: input,
  });
};

export const getVapidPublicKey = () => env.vapid.publicKey || null;

export const savePushSubscription = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  userAgent?: string,
) => {
  await User.updateOne(
    { _id: userId, "pushSubscriptions.endpoint": { $ne: subscription.endpoint } },
    {
      $push: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: userAgent || "",
          createdAt: new Date(),
        },
      },
    },
  );
  // Refresh keys if endpoint already exists
  await User.updateOne(
    { _id: userId, "pushSubscriptions.endpoint": subscription.endpoint },
    {
      $set: {
        "pushSubscriptions.$.keys": subscription.keys,
        "pushSubscriptions.$.userAgent": userAgent || "",
      },
    },
  );
};

export const removePushSubscription = async (
  userId: string,
  endpoint: string,
) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } },
  );
};

export const updateNotificationPrefs = async (
  userId: string,
  prefs: Partial<{ email: boolean; inApp: boolean; push: boolean }>,
) => {
  const user = await User.findById(userId);
  if (!user) return null;
  user.notificationPrefs = {
    email: prefs.email ?? user.notificationPrefs?.email ?? true,
    inApp: prefs.inApp ?? user.notificationPrefs?.inApp ?? true,
    push: prefs.push ?? user.notificationPrefs?.push ?? true,
  };
  await user.save();
  return user.notificationPrefs;
};
