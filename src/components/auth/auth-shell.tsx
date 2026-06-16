import Link from "next/link";
import { Check, Quote } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  "Unlimited themed short links",
  "Real-time click analytics",
  "Lightning-fast global redirects",
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-fuchsia-600 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 size-80 rounded-full bg-black/10 blur-3xl" />

        <Link href="/" className="relative z-10 w-fit">
          <Logo className="text-white [&_span]:text-white" />
        </Link>

        <div className="relative z-10 space-y-8">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            The premium way to shorten, theme &amp; measure your links.
          </h2>
          <ul className="space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-white/90">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative z-10 max-w-md rounded-2xl bg-white/10 p-5 backdrop-blur">
          <Quote className="size-5 text-white/70" />
          <blockquote className="mt-2 text-sm text-white/90">
            “We moved all our campaign links to Trimly. The themed redirect pages
            doubled our click-through on launches.”
          </blockquote>
          <figcaption className="mt-3 text-xs font-medium text-white/70">
            — Priya N., Growth Lead
          </figcaption>
        </figure>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="absolute left-6 top-6 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
