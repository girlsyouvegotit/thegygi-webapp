/**
 * Format a date to ISO string without milliseconds
 */
export const toISODate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Format a date to a readable string
 */
export const toReadableDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format a time to a readable string
 */
export const toReadableTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

/**
 * Calculate duration between two dates in minutes
 */
export const getDurationInMinutes = (
  startDate: Date,
  endDate: Date,
): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60));
};

/**
 * Calculate duration between two dates in seconds
 */
export const getDurationInSeconds = (
  startDate: Date,
  endDate: Date,
): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / 1000);
};

/**
 * Add minutes to a date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Format duration in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format timestamp to video timecode (HH:MM:SS)
 */
export const formatTimecode = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs]
    .map((val) => String(val).padStart(2, "0"))
    .join(":");
};
