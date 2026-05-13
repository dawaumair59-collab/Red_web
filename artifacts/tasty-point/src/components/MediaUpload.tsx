import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MediaType = "image" | "video" | "any";
type UploadStatus = "idle" | "uploading" | "success" | "error";

interface MediaUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: MediaType;
  label?: string;
}

async function getCloudinarySignature(folder: string) {
  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json() as Promise<{ signature: string; timestamp: number; apiKey: string; folder: string }>;
}

async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<string> {
  const sign = await getCloudinarySignature(folder);
  const cloudName = (window as unknown as { __VITE_CLOUDINARY_CLOUD_NAME__?: string }).__VITE_CLOUDINARY_CLOUD_NAME__
    ?? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message: string } };
        if (data.secure_url) resolve(data.secure_url);
        else reject(new Error(data.error?.message ?? "Upload failed"));
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));

    const form = new FormData();
    form.append("file", file);
    form.append("signature", sign.signature);
    form.append("timestamp", String(sign.timestamp));
    form.append("api_key", sign.apiKey);
    form.append("folder", sign.folder ?? folder);
    xhr.send(form);
  });
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes("/video/upload/");
}

function acceptStr(type: MediaType) {
  if (type === "image") return "image/*";
  if (type === "video") return "video/*";
  return "image/*,video/*";
}

export function MediaUpload({ value, onChange, accept = "image", label }: MediaUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");
    try {
      const url = await uploadToCloudinary(file, "tasty-point", setProgress);
      onChange(url);
      setStatus("success");
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleRemove = () => { onChange(null); setStatus("idle"); setProgress(0); };

  const isVideo = value ? isVideoUrl(value) : false;

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative rounded-xl overflow-hidden border-2 border-border group"
          >
            {isVideo ? (
              <video
                src={value}
                className="w-full h-44 object-cover bg-black"
                controls
                muted
                playsInline
                data-testid="video-preview"
              />
            ) : (
              <img
                src={value}
                alt="Uploaded media"
                className="w-full h-44 object-cover"
                data-testid="image-preview"
              />
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemove}
                data-testid="button-remove-media"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                {isVideo ? <><Video className="h-3 w-3" /> Video</> : <><ImageIcon className="h-3 w-3" /> Image</>}
              </span>
            </div>
            {status === "success" && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => status !== "uploading" && inputRef.current?.click()}
            disabled={status === "uploading"}
            data-testid="button-upload-media"
            className={cn(
              "w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-200 text-left",
              dragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary hover:bg-muted/40",
              status === "error" && "border-destructive bg-destructive/5",
              status === "uploading" && "cursor-wait"
            )}
          >
            <AnimatePresence mode="wait">
              {status === "uploading" ? (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 w-full px-8"
                >
                  <Upload className="h-8 w-8 text-primary animate-bounce" />
                  <div className="w-full">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1.5">
                      Uploading… {progress}%
                    </p>
                  </div>
                </motion.div>
              ) : status === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 px-4 text-center"
                >
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-xs font-medium text-destructive">Upload failed</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{errorMsg}</p>
                  <span className="text-xs text-primary underline">Try again</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 text-center px-4"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {accept === "video"
                      ? <Video className="h-6 w-6 text-muted-foreground" />
                      : accept === "any"
                      ? <Upload className="h-6 w-6 text-muted-foreground" />
                      : <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {accept === "image" && "PNG, JPG, WebP up to 10MB"}
                      {accept === "video" && "MP4, WebM up to 100MB"}
                      {accept === "any" && "Images & videos supported"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={acceptStr(accept)}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        data-testid="input-file-upload"
      />
    </div>
  );
}
