import { z } from "zod";

export const extendSubscriptionSchema = z.object({
  userId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365),
});

export const websiteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(60).optional(),
  tagline: z.string().trim().max(160).optional(),
  supportEmail: z.string().email().or(z.literal("")).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  contactAddress: z.string().trim().max(240).optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  seoKeywords: z.string().trim().max(300).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(300).optional(),
  planName: z.string().trim().max(60).optional(),
  planPriceInr: z.coerce.number().min(0).max(100000).optional(),
  planDurationDays: z.coerce.number().int().min(1).max(3650).optional(),
  cashfreeEnv: z.enum(["PRODUCTION", "SANDBOX"]).optional(),
  cashfreeAppId: z.string().trim().max(120).optional(),
  privacyPolicy: z.string().max(20000).optional(),
  termsOfService: z.string().max(20000).optional(),
});

export type WebsiteSettingsInput = z.infer<typeof websiteSettingsSchema>;
