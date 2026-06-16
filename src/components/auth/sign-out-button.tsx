"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton({
  variant = "outline",
  size,
  className,
  label = "Sign out",
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-4" />
      {label}
    </Button>
  );
}
