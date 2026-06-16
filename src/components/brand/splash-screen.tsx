"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/logo";
import { clientEnv } from "@/lib/env";

/**
 * Animated splash overlay shown on first app open.
 * Displays the logo, brand name, and a progress bar for ~2.4s, then fades out.
 * Uses sessionStorage so it only appears once per browser session.
 */
export function SplashScreen({
  minDurationMs = 2400,
  onDone,
}: {
  minDurationMs?: number;
  onDone?: () => void;
}) {
  const [visible, setVisible] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("trimly_splash")) {
      setVisible(false);
      onDone?.();
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / minDurationMs) * 100));
    }, 30);

    const timer = setTimeout(() => {
      clearInterval(interval);
      sessionStorage.setItem("trimly_splash", "1");
      setVisible(false);
      onDone?.();
    }, minDurationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDurationMs, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            >
              <LogoMark className="size-20" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                {clientEnv.NEXT_PUBLIC_APP_NAME}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Premium links, beautifully short.
              </p>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-indigo-500"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
