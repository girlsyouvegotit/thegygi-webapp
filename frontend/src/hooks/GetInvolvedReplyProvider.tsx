import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Mail, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  buildGetInvolvedReplyDraft,
  openMailto,
  type GetInvolvedReplyDraft,
} from "@/lib/getInvolvedReply";

type GetInvolvedReplyContextValue = {
  openGetInvolvedReply: (notification: {
    metadata?: Record<string, unknown> | null;
  }) => boolean;
  closeGetInvolvedReply: () => void;
};

const GetInvolvedReplyContext =
  createContext<GetInvolvedReplyContextValue | null>(null);

export function GetInvolvedReplyProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GetInvolvedReplyDraft | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const closeGetInvolvedReply = useCallback(() => {
    setOpen(false);
    setDraft(null);
    setSubject("");
    setBody("");
  }, []);

  const openGetInvolvedReply = useCallback(
    (notification: { metadata?: Record<string, unknown> | null }) => {
      const next = buildGetInvolvedReplyDraft(notification);
      if (!next) return false;
      setDraft(next);
      setSubject(next.subject);
      setBody(next.body);
      setOpen(true);
      return true;
    },
    [],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeGetInvolvedReply();
      else setOpen(true);
    },
    [closeGetInvolvedReply],
  );

  const handleSend = useCallback(() => {
    if (!draft?.to) return;
    const ok = openMailto({
      to: draft.to,
      subject: subject.trim() || draft.subject,
      body: body.trim() || draft.body,
    });
    if (ok) closeGetInvolvedReply();
  }, [draft, subject, body, closeGetInvolvedReply]);

  const value = useMemo(
    () => ({
      openGetInvolvedReply,
      closeGetInvolvedReply,
    }),
    [openGetInvolvedReply, closeGetInvolvedReply],
  );

  return (
    <GetInvolvedReplyContext.Provider value={value}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="z-[220] w-[calc(100vw-24px)] max-w-lg rounded-[1.5rem] p-5 sm:p-6"
          overlayClassName="z-[210]"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700">
                <Mail className="h-4 w-4" />
              </span>
              Reply to inquiry
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review or edit this draft, then open it in your email app to send
              {draft?.name ? ` to ${draft.name}` : ""}.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="get-involved-to" className="text-xs font-bold">
                  To
                </Label>
                <Input
                  id="get-involved-to"
                  value={draft.to}
                  readOnly
                  disabled
                  className="rounded-xl bg-muted/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="get-involved-subject"
                  className="text-xs font-bold"
                >
                  Subject
                </Label>
                <Input
                  id="get-involved-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="get-involved-body"
                  className="text-xs font-bold"
                >
                  Message
                </Label>
                <Textarea
                  id="get-involved-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="min-h-[220px] resize-y rounded-xl font-sans text-sm leading-relaxed"
                />
              </div>

              {draft.interest ? (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Inquiry type:{" "}
                  <span className="font-semibold text-foreground">
                    {draft.interest}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={closeGetInvolvedReply}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={handleSend}
              disabled={!draft?.to || !subject.trim() || !body.trim()}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Open in email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GetInvolvedReplyContext.Provider>
  );
}

export function useGetInvolvedReply() {
  const ctx = useContext(GetInvolvedReplyContext);
  if (!ctx) {
    throw new Error(
      "useGetInvolvedReply must be used within GetInvolvedReplyProvider",
    );
  }
  return ctx;
}

/** Safe variant for places that may render outside the provider. */
export function useGetInvolvedReplyOptional() {
  return useContext(GetInvolvedReplyContext);
}
