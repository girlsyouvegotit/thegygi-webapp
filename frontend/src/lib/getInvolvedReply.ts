type MailtoMeta = {
  name?: unknown;
  email?: unknown;
  interest?: unknown;
  action?: unknown;
};

export type GetInvolvedReplyDraft = {
  to: string;
  name: string;
  interest: string;
  subject: string;
  body: string;
};

export function isGetInvolvedInquiryNotification(n: {
  type?: string;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (n.type === "get_involved_inquiry") return true;
  const meta = (n.metadata || {}) as MailtoMeta;
  return meta.action === "mailto_reply";
}

export function buildGetInvolvedReplyDraft(n: {
  metadata?: Record<string, unknown> | null;
}): GetInvolvedReplyDraft | null {
  const meta = (n.metadata || {}) as MailtoMeta;
  const email = typeof meta.email === "string" ? meta.email.trim() : "";
  if (!email) return null;

  const name =
    typeof meta.name === "string" && meta.name.trim()
      ? meta.name.trim()
      : "there";
  const interest =
    typeof meta.interest === "string" && meta.interest.trim()
      ? meta.interest.trim()
      : "Get Involved";

  const subject = `Re: GYGI ${interest} — ${name}`;
  const body = [
    `Hi ${name},`,
    ``,
    `Thank you for reaching out about ${interest} with Girls You Got It (GYGI).`,
    ``,
    `We received your inquiry and would love to connect with you about next steps.`,
    ``,
    `[Add your message here]`,
    ``,
    `Warm regards,`,
    `The GYGI Team`,
    `Girls You Got It`,
  ].join("\n");

  return { to: email, name, interest, subject, body };
}

export function openMailto(draft: {
  to: string;
  subject: string;
  body: string;
}): boolean {
  const to = draft.to.trim();
  if (!to) return false;

  window.location.href = `mailto:${to}?subject=${encodeURIComponent(
    draft.subject,
  )}&body=${encodeURIComponent(draft.body)}`;
  return true;
}

/** @deprecated Prefer compose modal + openMailto */
export function openGetInvolvedReplyMailto(n: {
  metadata?: Record<string, unknown> | null;
}): boolean {
  const draft = buildGetInvolvedReplyDraft(n);
  if (!draft) return false;
  return openMailto(draft);
}
