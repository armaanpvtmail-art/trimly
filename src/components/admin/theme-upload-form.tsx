"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileArchive, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { uploadTheme } from "@/server/actions/admin-themes";

export function ThemeUploadForm() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    if (!/\.zip$/i.test(file.name)) {
      toast.error("Please choose a .zip file.");
      return;
    }
    setFileName(file.name);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadTheme(fd);
    setUploading(false);
    if (res.ok) {
      toast.success("Theme uploaded and enabled");
      setFileName(null);
      router.refresh();
    } else {
      toast.error(res.message || "Upload failed");
    }
  }

  return (
    <Card className="p-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {uploading ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <UploadCloud className="size-7" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {uploading ? "Uploading & validating…" : "Drop a theme ZIP or click to browse"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fileName ? (
              <span className="inline-flex items-center gap-1">
                <FileArchive className="size-3.5" /> {fileName}
              </span>
            ) : (
              "Must contain theme.json + index.html (css/js/assets optional)"
            )}
          </p>
        </div>
      </label>
    </Card>
  );
}
