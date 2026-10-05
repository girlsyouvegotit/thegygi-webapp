import type { notification } from "@/types";
import type { OfficialChatOpenArgs } from "@/hooks/OfficialChatProvider";

export function isOfficialChatNotification(n: {
  type?: string;
  metadata?: Record<string, unknown> | null;
  link?: string | null;
}): boolean {
  if (n.type !== "moderation_message") return false;
  const meta = n.metadata || {};
  return Boolean(
    meta.openOfficialChat || meta.threadId || meta.actionId,
  );
}

export function officialChatArgsFromNotification(
  n: Pick<notification, "metadata">,
): OfficialChatOpenArgs | null {
  const meta = (n.metadata || {}) as Record<string, unknown>;
  const threadId =
    typeof meta.threadId === "string" ? meta.threadId : undefined;
  const actionId =
    typeof meta.actionId === "string" ? meta.actionId : undefined;
  if (!threadId && !actionId) return null;
  return { threadId, actionId };
}
