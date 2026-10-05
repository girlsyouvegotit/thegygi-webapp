/** Max size for chat / DM / assignment file attachments */
export const MAX_SHARE_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SHARE_FILE_LABEL = "5MB";

export function assertShareFilesWithinLimit(
  files: File[],
): { ok: true } | { ok: false; message: string } {
  const oversized = files.filter((f) => f.size > MAX_SHARE_FILE_BYTES);
  if (!oversized.length) return { ok: true };
  const names = oversized.map((f) => f.name).join(", ");
  return {
    ok: false,
    message: `Each file must be ${MAX_SHARE_FILE_LABEL} or smaller. Too large: ${names}`,
  };
}
