import { z } from "zod";

/** Schema for the `theme.json` manifest inside an uploaded theme ZIP. */
export const themeJsonSchema = z.object({
  name: z.string().min(1, "theme.json: name is required").max(60),
  description: z.string().max(300).optional(),
  version: z.string().max(20).optional().default("1.0.0"),
  mode: z.enum(["light", "dark"]).optional().default("dark"),
  palette: z
    .object({
      from: z.string().optional(),
      via: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  countdownDefault: z.coerce.number().int().min(0).max(60).optional().default(5),
  entry: z.string().max(120).optional().default("index.html"),
  preview: z.string().max(160).optional(),
  // "html" renders the uploaded index.html in a sandboxed iframe;
  // "react" reuses Trimly's built-in countdown UI with this theme's palette/assets.
  render: z.enum(["html", "react"]).optional().default("html"),
  background: z
    .object({ image: z.string().optional(), video: z.string().optional() })
    .optional(),
  logo: z.string().optional(),
});

export type ThemeJson = z.infer<typeof themeJsonSchema>;

export const updateThemeMetaSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  countdownDefault: z.coerce.number().int().min(0).max(60),
});
