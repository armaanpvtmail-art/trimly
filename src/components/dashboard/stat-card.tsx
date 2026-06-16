"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <Card className="group p-5 transition-shadow hover:shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform group-hover:scale-110">
            <Icon className="size-[18px]" />
          </span>
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </Card>
    </motion.div>
  );
}
