import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientEnv } from "@/lib/env";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-glow",
        className,
      )}
    >
      <Link2 className="size-1/2" strokeWidth={2.5} />
    </div>
  );
}

export function Logo({
  className,
  showName = true,
}: {
  className?: string;
  showName?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-9" />
      {showName && (
        <span className="text-lg font-bold tracking-tight">
          {clientEnv.NEXT_PUBLIC_APP_NAME}
        </span>
      )}
    </div>
  );
}
