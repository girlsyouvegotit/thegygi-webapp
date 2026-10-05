import { useMemo, useRef, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Upload,
  Link2,
  FileText,
  Loader2,
  X,
  File as FileIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUploadThing } from "@/lib/uploadthing";
import { assertShareFilesWithinLimit } from "@/lib/fileUploadLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { assignment } from "@/types";

const MAX_WORDS = 3000;

const countWords = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

function pickFileUrl(
  file:
    | {
        url?: string;
        ufsUrl?: string;
        name?: string;
        serverData?: { url?: string; name?: string } | null;
      }
    | undefined,
) {
  return {
    url: file?.serverData?.url || file?.ufsUrl || file?.url || "",
    name: file?.serverData?.name || file?.name || "file",
  };
}

const submissionSchema = z
  .object({
    submissionType: z.enum(["file", "text", "github_url"]),
    content: z.string().optional().default(""),
    attachments: z.array(z.string().url()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.submissionType === "text") {
      const words = countWords(data.content || "");
      if (words < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Write your answer before submitting",
          path: ["content"],
        });
      } else if (words > MAX_WORDS) {
        ctx.addIssue({
          code: "custom",
          message: `Text cannot exceed ${MAX_WORDS.toLocaleString()} words`,
          path: ["content"],
        });
      }
      return;
    }

    if (data.submissionType === "github_url") {
      const url = (data.content || "").trim();
      if (!url) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a link",
          path: ["content"],
        });
      } else if (!/^https?:\/\/.+/i.test(url)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid URL starting with http:// or https://",
          path: ["content"],
        });
      }
      return;
    }

    if (data.submissionType === "file") {
      if (!data.attachments || data.attachments.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Upload at least one file",
          path: ["attachments"],
        });
      }
    }
  });

type FormValues = z.infer<typeof submissionSchema>;

interface UploadedAttachment {
  url: string;
  name: string;
}

interface AssignmentSubmissionProps {
  assignment: assignment;
  onSubmitted?: () => void;
}

const pillInput =
  "h-12 rounded-full border-slate-200 bg-slate-50 px-5 text-base shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:h-11 sm:text-sm";

const pillTextarea =
  "min-h-40 resize-y rounded-3xl border-slate-200 bg-slate-50 px-5 py-4 text-base leading-relaxed shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:min-h-36 sm:text-sm";

const AssignmentSubmission = ({
  assignment,
  onSubmitted,
}: AssignmentSubmissionProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = useMemo((): Array<"file" | "text" | "github_url"> => {
    return assignment.submissionTypes?.length
      ? assignment.submissionTypes
      : ["text"];
  }, [assignment.submissionTypes]);

  const form = useForm<FormValues>({
    resolver: zodResolver(submissionSchema) as Resolver<FormValues>,
    mode: "onTouched",
    defaultValues: {
      submissionType: allowedTypes[0] || "text",
      content: "",
      attachments: [],
    },
  });

  const submissionType = form.watch("submissionType");
  const content = form.watch("content") || "";
  const wordCount = countWords(content);

  const { startUpload, isUploading } = useUploadThing("assignmentFileUploader", {
    onUploadError: (error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });

  const syncAttachments = (files: UploadedAttachment[]) => {
    setUploadedFiles(files);
    form.setValue(
      "attachments",
      files.map((f) => f.url),
      { shouldValidate: true, shouldDirty: true },
    );
    if (files.length > 0) {
      form.setValue("content", files.map((f) => f.name).join(", "), {
        shouldDirty: true,
      });
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const remaining = Math.max(0, 3 - uploadedFiles.length);
    if (remaining <= 0) {
      toast.error("You can upload up to 3 files");
      return;
    }

    const batch = files.slice(0, remaining);
    const sizeCheck = assertShareFilesWithinLimit(batch);
    if (!sizeCheck.ok) {
      toast.error(sizeCheck.message);
      return;
    }
    const uploaded = await startUpload(batch);
    const next = (uploaded || [])
      .map(pickFileUrl)
      .filter((f) => Boolean(f.url));

    if (!next.length) {
      toast.error("Upload failed — please try again");
      return;
    }

    syncAttachments([...uploadedFiles, ...next]);
    toast.success(
      next.length === 1 ? "File uploaded" : `${next.length} files uploaded`,
    );
  };

  const removeFile = (url: string) => {
    syncAttachments(uploadedFiles.filter((f) => f.url !== url));
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        submissionType: values.submissionType,
        content:
          values.submissionType === "file"
            ? values.content?.trim() ||
              uploadedFiles.map((f) => f.name).join(", ") ||
              "File submission"
            : (values.content || "").trim(),
        attachments:
          values.submissionType === "file"
            ? values.attachments || []
            : [],
      };

      await api.post(`/assignments/${assignment._id}/submit`, payload);
      toast.success("Assignment submitted successfully");
      onSubmitted?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to submit assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tabCount = allowedTypes.length;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      style={{ fontSize: "16px" }}
    >
      <Tabs
        value={submissionType}
        onValueChange={(value) => {
          form.setValue(
            "submissionType",
            value as FormValues["submissionType"],
            { shouldValidate: true },
          );
        }}
      >
        {tabCount > 1 && (
          <TabsList
            className={cn(
              "mb-4 grid h-11 w-full rounded-full bg-slate-100 p-1",
              tabCount === 2 && "grid-cols-2",
              tabCount >= 3 && "grid-cols-3",
            )}
          >
            {allowedTypes.includes("text") && (
              <TabsTrigger
                value="text"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="mr-1.5 h-4 w-4" /> Text
              </TabsTrigger>
            )}
            {allowedTypes.includes("file") && (
              <TabsTrigger
                value="file"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Upload className="mr-1.5 h-4 w-4" /> File
              </TabsTrigger>
            )}
            {allowedTypes.includes("github_url") && (
              <TabsTrigger
                value="github_url"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Link2 className="mr-1.5 h-4 w-4" /> Link
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {allowedTypes.includes("text") && (
          <TabsContent value="text" className="mt-0 space-y-2">
            <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel>Your answer</FieldLabel>
                  <Textarea
                    rows={8}
                    placeholder="Write your submission here…"
                    className={pillTextarea}
                    {...field}
                  />
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className={cn(
                        wordCount > MAX_WORDS
                          ? "font-semibold text-rose-600"
                          : "text-slate-500",
                      )}
                    >
                      {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}{" "}
                      words
                    </span>
                    {wordCount > MAX_WORDS ? (
                      <span className="text-rose-600">
                        Trim {(wordCount - MAX_WORDS).toLocaleString()} words
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Maximum {MAX_WORDS.toLocaleString()} words
                      </span>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </TabsContent>
        )}

        {allowedTypes.includes("github_url") && (
          <TabsContent value="github_url" className="mt-0">
            <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel>Submission link</FieldLabel>
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://github.com/username/repo"
                    className={pillInput}
                    {...field}
                  />
                  <p className="text-[11px] text-slate-500">
                    Paste a full URL (GitHub, Google Drive, Notion, etc.)
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </TabsContent>
        )}

        {allowedTypes.includes("file") && (
          <TabsContent value="file" className="mt-0 space-y-3">
            <Field
              data-invalid={Boolean(form.formState.errors.attachments)}
              className="gap-2"
            >
              <FieldLabel>Upload files</FieldLabel>
              <p className="text-[11px] text-slate-500">
                Up to 3 files · max 5MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip,.ppt,.pptx,.xls,.xlsx"
                onChange={(e) => {
                  void handleFilesSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploading || uploadedFiles.length >= 3}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition",
                  "hover:border-primary/40 hover:bg-primary/5",
                  (isUploading || uploadedFiles.length >= 3) &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-primary" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {isUploading ? "Uploading…" : "Click to upload a file"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    PDF, docs, images, or zip · up to 3 files · 32 MB each
                  </p>
                </div>
              </button>

              {uploadedFiles.length > 0 && (
                <ul className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <li
                      key={file.url}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileIcon className="h-4 w-4" />
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-primary"
                      >
                        {file.name}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full"
                        onClick={() => removeFile(file.url)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4 text-rose-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {form.formState.errors.attachments && (
                <FieldError errors={[form.formState.errors.attachments]} />
              )}
            </Field>
          </TabsContent>
        )}
      </Tabs>

      <Button
        type="submit"
        className="h-12 w-full rounded-full text-base shadow-md shadow-primary/20 sm:h-11 sm:text-sm"
        disabled={
          submitting ||
          isUploading ||
          (submissionType === "text" && wordCount > MAX_WORDS)
        }
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Assignment"
        )}
      </Button>
    </form>
  );
};

export default AssignmentSubmission;
