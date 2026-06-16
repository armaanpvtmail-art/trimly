"use client";

import * as React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function QrDialog({
  url,
  trigger,
}: {
  url: string;
  trigger?: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  function download() {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "trimly-qr.png";
    link.click();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" aria-label="Show QR code">
            <QrCode className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>QR code</DialogTitle>
        </DialogHeader>
        <div
          ref={containerRef}
          className="mx-auto flex w-fit justify-center rounded-xl bg-white p-4"
        >
          <QRCodeCanvas value={url} size={208} level="M" marginSize={2} />
        </div>
        <p className="truncate text-center text-xs text-muted-foreground">{url}</p>
        <Button onClick={download} variant="gradient" className="w-full">
          <Download className="size-4" /> Download PNG
        </Button>
      </DialogContent>
    </Dialog>
  );
}
