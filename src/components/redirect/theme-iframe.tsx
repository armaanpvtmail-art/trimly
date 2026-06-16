"use client";

import * as React from "react";

/**
 * Renders an uploaded HTML theme inside a sandboxed iframe.
 * The render route injects a bootstrap script that runs the countdown and
 * redirects the top window. A parent-side fallback guarantees the redirect
 * still happens even if the theme's markup is broken.
 */
export function ThemeIframe({
  slug,
  destinationUrl,
  countdownSeconds,
}: {
  slug: string;
  destinationUrl: string;
  countdownSeconds: number;
}) {
  const src = `/api/themes/${encodeURIComponent(slug)}/render?to=${encodeURIComponent(
    destinationUrl,
  )}&c=${countdownSeconds}`;

  React.useEffect(() => {
    const ms = (countdownSeconds + 4) * 1000;
    const t = setTimeout(() => {
      window.location.replace(destinationUrl);
    }, ms);
    return () => clearTimeout(t);
  }, [destinationUrl, countdownSeconds]);

  return (
    <iframe
      title="Redirecting"
      src={src}
      className="h-screen w-screen border-0"
      sandbox="allow-scripts allow-same-origin allow-top-navigation allow-top-navigation-by-user-activation allow-forms allow-popups"
    />
  );
}
