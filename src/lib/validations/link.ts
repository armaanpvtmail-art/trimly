import { z } from "zod";

const urlField = z
  .string()
  .trim()
  .min(1, "Destination URL is required")
  .url("Enter a valid URL (including https://)")
  .refine(
    (u) => /^https?:\/\//i.test(u),
    "URL must start with http:// or https://",
  )
  .refine((u) => u.length <= 2048, "URL is too long");

export const createLinkSchema = z.object({
  destinationUrl: urlField,
  title: z.string().trim().max(120).optional().or(z.literal("")),
  customSlug: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{3,40}$/, "3–40 letters, numbers, - or _")
    .optional()
    .or(z.literal("")),
  themeId: z.string().optional().or(z.literal("")),
  countdownSeconds: z.coerce.number().int().min(0).max(60).default(5),
});

export const updateLinkSchema = z.object({
  destinationUrl: urlField,
  title: z.string().trim().max(120).optional().or(z.literal("")),
  themeId: z.string().optional().or(z.literal("")),
  countdownSeconds: z.coerce.number().int().min(0).max(60).default(5),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
