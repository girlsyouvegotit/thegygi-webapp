/**
 * Class alert helpers — in-app toast reminders (no browser permission prompts).
 * Reminds students ~15 minutes before a scheduled live class while GYGI is open.
 */

import { toast } from "sonner";

const PREF_KEY = "gygi:class-alerts-enabled";
const SHOWN_KEY = "gygi:class-alerts-shown";
export const CLASS_ALERT_LEAD_MS = 15 * 60 * 1000;

export type ClassAlertTarget = {
  _id: string;
  title: string;
  scheduledDate: string;
  status: string;
};

const timers = new Map<string, number>();

export const getClassAlertsPreference = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "1";
};

export const areClassAlertsActive = (): boolean => getClassAlertsPreference();

export const clearScheduledClassReminders = (): void => {
  for (const id of timers.keys()) {
    const handle = timers.get(id);
    if (handle != null) window.clearTimeout(handle);
  }
  timers.clear();
};

const getShownIds = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const markShown = (classId: string): void => {
  const shown = getShownIds();
  shown.add(classId);
  sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
};

const showClassReminder = (cls: ClassAlertTarget): void => {
  if (!areClassAlertsActive()) return;
  if (getShownIds().has(cls._id)) return;

  const start = new Date(cls.scheduledDate);
  const timeLabel = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  toast.message("Class starting soon", {
    description: `"${cls.title}" starts at ${timeLabel}. Head to Live Classes to join.`,
    duration: 12_000,
    action: {
      label: "Open",
      onClick: () => {
        window.location.href = "/live-classes";
      },
    },
  });

  markShown(cls._id);
};

/**
 * Schedule in-app toast reminders for upcoming scheduled classes.
 * Safe to call repeatedly — clears previous timers first.
 */
export const scheduleClassReminders = (
  classes: ClassAlertTarget[],
): number => {
  clearScheduledClassReminders();
  if (!areClassAlertsActive()) return 0;

  const now = Date.now();
  let scheduled = 0;

  for (const cls of classes) {
    if (cls.status !== "scheduled") continue;
    const start = new Date(cls.scheduledDate).getTime();
    if (!Number.isFinite(start) || start <= now) continue;

    const fireAt = start - CLASS_ALERT_LEAD_MS;
    let delay = fireAt - now;

    // Already inside the 15-minute window → remind shortly
    if (delay <= 0) {
      delay = 1_500;
    }

    // setTimeout is unreliable beyond ~24 days; skip far-future classes
    if (delay > 7 * 24 * 60 * 60 * 1000) continue;

    const handle = window.setTimeout(() => {
      timers.delete(cls._id);
      showClassReminder(cls);
    }, delay);

    timers.set(cls._id, handle);
    scheduled += 1;
  }

  return scheduled;
};

export type EnableClassAlertsResult = "enabled";

export const enableClassAlerts = (
  classes: ClassAlertTarget[] = [],
): EnableClassAlertsResult => {
  localStorage.setItem(PREF_KEY, "1");
  scheduleClassReminders(classes);
  return "enabled";
};

export const disableClassAlerts = (): void => {
  localStorage.setItem(PREF_KEY, "0");
  clearScheduledClassReminders();
};
