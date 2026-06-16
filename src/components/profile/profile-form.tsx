"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/server/actions/profile";

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const value = String(new FormData(e.currentTarget).get("name") || "");
    start(async () => {
      const res = await updateProfile({ name: value });
      if (res.ok) {
        toast.success(res.message || "Saved");
        router.refresh();
      } else {
        setError(res.fieldErrors?.name || res.message || "Failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={name} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Email changes aren&apos;t available yet — contact support to update it.
        </p>
      </div>
      <Button type="submit" variant="gradient" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
