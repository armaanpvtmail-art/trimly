"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({
  value,
  variant = "outline",
  size = "icon",
  className,
  label,
}: {
  value: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={copy}>
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      {label}
    </Button>
  );
}
