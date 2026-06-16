import { z } from "zod";

/**
 * Centralised, validated environment access.
 * Importing this module guarantees required vars exist at boot (server side).
 * Client-safe vars are exposed separately via `clientEnv`.
 */

const bool = (def = false) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? def : v === "true" || v === "1"));

const num = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? def : Number(v)))
    .pipe(z.number());

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  CASHFREE_ENV: z.enum(["PRODUCTION", "SANDBOX"]).default("PRODUCTION"),
  CASHFREE_APP_ID: z.string().default(""),
  CASHFREE_SECRET_KEY: z.string().default(""),
  CASHFREE_WEBHOOK_SECRET: z.string().default(""),
  CASHFREE_API_VERSION: z.string().default("2023-08-01"),

  PLAN_PRICE_INR: num(90),
  PLAN_NAME: z.string().default("Premium Monthly"),
  PLAN_DURATION_DAYS: num(30),
  PLAN_CURRENCY: z.string().default("INR"),

  SMTP_HOST: z.string().default(""),
  SMTP_PORT: num(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM: z.string().default("Trimly <no-reply@trimly.app>"),

  ADMIN_EMAIL: z.string().default("admin@trimly.app"),
  ADMIN_PASSWORD: z.string().default("ChangeMe!2026"),
  ADMIN_NAME: z.string().default("Trimly Admin"),

  THEME_UPLOAD_DIR: z.string().default("public/uploads/themes"),
  MAX_THEME_ZIP_MB: num(20),

  TRUSTED_ORIGINS: z.string().default(""),
  RATE_LIMIT_MAX: num(60),
  RATE_LIMIT_WINDOW_SECONDS: num(60),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Trimly"),
});

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}

// Validate server env lazily so client bundles never import secrets.
let _serverEnv: z.infer<typeof serverSchema> | null = null;
export function getServerEnv() {
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `❌ Invalid server environment variables:\n${format(parsed.error)}`,
    );
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

/**
 * Lightweight plan config reader with safe defaults — does NOT require the full
 * server env (DB/secret). Safe to call from statically-rendered public pages.
 * For settings that can be overridden at runtime, prefer reading WebsiteSettings.
 */
export function getPlanConfig() {
  return {
    priceInr: Number(process.env.PLAN_PRICE_INR || 90),
    name: process.env.PLAN_NAME || "Premium Monthly",
    durationDays: Number(process.env.PLAN_DURATION_DAYS || 30),
    currency: process.env.PLAN_CURRENCY || "INR",
  };
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type PlanConfig = ReturnType<typeof getPlanConfig>;
