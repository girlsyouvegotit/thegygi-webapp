/** In-memory presence for realtime community pulse (socket-connected users). */

const onlineUserIds = new Set<string>();

export const presenceTrack = (userId: string): void => {
  if (userId) onlineUserIds.add(String(userId));
};

export const presenceUntrack = (userId: string): void => {
  if (userId) onlineUserIds.delete(String(userId));
};

export const getOnlineUserIds = (): string[] => Array.from(onlineUserIds);

export const getOnlineUserCount = (): number => onlineUserIds.size;
