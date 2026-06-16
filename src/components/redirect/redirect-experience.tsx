"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import type { ResolvedTheme } from "@/server/queries/redirect";

interface ThemeConfig {
  palette?: { from?: string; via?: string; to?: string };
  mode?: "light" | "dark";
  animation?: string;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function RedirectExperience({
  destinationUrl,
  countdownSeconds,
  theme,
}: {
  destinationUrl: string;
  countdownSeconds: number;
  theme: ResolvedTheme | null;
}) {
  const cfg = (theme?.config ?? {}) as ThemeConfig;
  const from = cfg.palette?.from ?? "#0b1020";
  const via = cfg.palette?.via ?? "#1e293b";
  const to = cfg.palette?.to ?? "#0b1020";
  const isLight = cfg.mode === "light";
  const text = isLight ? "#0f172a" : "#ffffff";
  const subtext = isLight ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.7)";
  const cardBg = isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.08)";

  const total = Math.max(0, countdownSeconds);
  const [secondsLeft, setSecondsLeft] = React.useState(total);
  const [redirecting, setRedirecting] = React.useState(false);

  const go = React.useCallback(() => {
    setRedirecting(true);
    window.location.replace(destinationUrl);
  }, [destinationUrl]);

  React.useEffect(() => {
    if (total <= 0) {
      go();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          go();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [total, go]);

  const r = 52;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? secondsLeft / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-6"
      style={{ background: `linear-gradient(135deg, ${from}, ${via}, ${to})`, color: text }}
    >
      {theme?.backgroundVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={theme.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {!theme?.backgroundVideo && theme?.backgroundImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.backgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-3xl border p-8 text-center backdrop-blur-xl"
        style={{ background: cardBg, borderColor: "rgba(255,255,255,0.15)" }}
      >
        {theme?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logo} alt="" className="mx-auto mb-6 h-12 object-contain" />
        ) : (
          <div className="mx-auto mb-6 flex w-fit items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
              <ExternalLink className="size-5" style={{ color: text }} />
            </div>
          </div>
        )}

        <p className="text-sm" style={{ color: subtext }}>
          You&apos;re being redirected to
        </p>
        <p className="mt-1 truncate text-lg font-semibold">{hostOf(destinationUrl)}</p>

        {/* Countdown ring */}
        <div className="my-8 flex justify-center">
          <div className="relative flex size-32 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={isLight ? "#6366f1" : "#ffffff"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="text-4xl font-bold tabular-nums">
              {redirecting ? "·" : secondsLeft}
            </span>
          </div>
        </div>

        <button
          onClick={go}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-transform active:scale-[0.98]"
          style={{
            background: isLight ? "#6366f1" : "#ffffff",
            color: isLight ? "#ffffff" : "#0f172a",
          }}
        >
          Continue now <ArrowRight className="size-5" />
        </button>

        <p
          className="mt-5 flex items-center justify-center gap-1.5 text-xs"
          style={{ color: subtext }}
        >
          <ShieldCheck className="size-3.5" /> Secured &amp; shortened by Trimly
        </p>
      </motion.div>
    </div>
  );
}
