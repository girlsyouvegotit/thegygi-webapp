import { useMemo, useState } from "react";
import {
  ExternalLink,
  File as FileIcon,
  Image as ImageIcon,
  Link2,
  Maximize2,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewKind = "image" | "pdf" | "office" | "webpage" | "unknown";

const fileNameFromUrl = (url: string) => {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    return path.split("/").filter(Boolean).pop() || url;
  } catch {
    return url.split("/").pop() || url;
  }
};

const detectKind = (url: string, mode: "file" | "link"): PreviewKind => {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(clean)) return "image";
  if (/\.pdf$/i.test(clean)) return "pdf";
  if (/\.(docx?|pptx?|xlsx?)$/i.test(clean)) return "office";
  if (mode === "link") return "webpage";
  return "unknown";
};

const embedUrlFor = (url: string, kind: PreviewKind): string => {
  if (kind === "office") {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  if (kind === "pdf") {
    // Google viewer helps when the CDN blocks iframe embedding.
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  return url;
};

interface SubmissionViewerProps {
  url: string;
  mode: "file" | "link";
  label?: string;
  className?: string;
}

const SubmissionViewer = ({
  url,
  mode,
  label,
  className,
}: SubmissionViewerProps) => {
  const [open, setOpen] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);

  const kind = useMemo(() => detectKind(url, mode), [url, mode]);
  const title = label || fileNameFromUrl(url);
  const embedUrl = useMemo(() => embedUrlFor(url, kind), [url, kind]);

  const Icon =
    kind === "image"
      ? ImageIcon
      : mode === "link"
        ? Link2
        : kind === "pdf"
          ? FileText
          : FileIcon;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFrameFailed(false);
          setOpen(true);
        }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left ring-1 ring-slate-200 transition hover:border-primary/30 hover:ring-primary/30",
          className,
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-primary">
            {title}
          </p>
          <p className="text-[11px] text-slate-500">
            Tap to view in app
          </p>
        </div>
        <Maximize2 className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="flex h-[min(92dvh,900px)] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-[min(96vw,64rem)]"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 px-4 py-3 pr-12 sm:px-5">
            <DialogTitle className="truncate text-base">
              {mode === "link" ? "Link preview" : "File preview"}
            </DialogTitle>
            <DialogDescription className="truncate text-xs">
              {title}
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-0 flex-1 bg-slate-100">
            {kind === "image" ? (
              <div className="flex h-full items-center justify-center overflow-auto p-3 sm:p-4">
                <img
                  src={url}
                  alt={title}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
                />
              </div>
            ) : frameFailed ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <FileIcon className="h-10 w-10 text-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    This content can&apos;t be embedded here
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    The source blocks in-app preview. You can still open it in a
                    new browser tab.
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-full"
                  onClick={() =>
                    window.open(url, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Open externally
                </Button>
              </div>
            ) : (
              <iframe
                title={title}
                src={embedUrl}
                className="h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer"
                onError={() => setFrameFailed(true)}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-[11px] text-slate-500">
              Viewing inside GYGI
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open externally
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubmissionViewer;
