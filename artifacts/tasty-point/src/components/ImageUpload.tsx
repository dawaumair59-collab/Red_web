import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetUploadSignature } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getSignature = useGetUploadSignature();
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const signData = await getSignature.mutateAsync({ data: { folder: "tasty-point" } });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signData.signature);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("api_key", signData.apiKey);
      formData.append("folder", signData.folder ?? "tasty-point");

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json() as { secure_url?: string; error?: { message: string } };
      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message ?? "Upload failed");
      }
      onChange(data.secure_url);
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange(null)}
            data-testid="button-remove-image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid="button-upload-image"
        >
          {uploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : (
            <>
              <Image className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        data-testid="input-file-upload"
      />
    </div>
  );
}
