import { generateUploadButton } from "@uploadthing/react";
import { toast } from "sonner";
import { API_UPLOADTHING_URL, uploadThingFetch } from "@/lib/uploadthing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UploadButton = generateUploadButton<any>({
  url: API_UPLOADTHING_URL,
  fetch: uploadThingFetch,
});

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
  /** When false, skips the generic "Image uploaded" toast (caller handles feedback). */
  showToast?: boolean;
}

const ImageUpload = ({
  onUploadComplete,
  disabled,
  showToast = true,
}: ImageUploadProps) => {
  return (
    <UploadButton
      endpoint="imageUploader"
      disabled={disabled}
      onClientUploadComplete={(files) => {
        const url = files[0]?.url;
        if (url) {
          onUploadComplete(url);
          if (showToast) toast.success("Image uploaded");
        }
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
      appearance={{
        button: "ut-ready:bg-primary ut-uploading:cursor-not-allowed",
        allowedContent: "text-xs text-muted-foreground",
      }}
      content={{
        button: "Upload image",
        allowedContent: "Image up to 4 MB",
      }}
    />
  );
};

export default ImageUpload;
