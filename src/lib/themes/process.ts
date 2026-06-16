import AdmZip from "adm-zip";
import { ThemeAssetType } from "@prisma/client";
import { themeJsonSchema, type ThemeJson } from "@/lib/validations/theme";

const ALLOWED_EXT: Record<string, { type: ThemeAssetType; mime: string }> = {
  html: { type: "HTML", mime: "text/html" },
  htm: { type: "HTML", mime: "text/html" },
  css: { type: "CSS", mime: "text/css" },
  js: { type: "JS", mime: "application/javascript" },
  mjs: { type: "JS", mime: "application/javascript" },
  json: { type: "JSON", mime: "application/json" },
  png: { type: "IMAGE", mime: "image/png" },
  jpg: { type: "IMAGE", mime: "image/jpeg" },
  jpeg: { type: "IMAGE", mime: "image/jpeg" },
  gif: { type: "IMAGE", mime: "image/gif" },
  svg: { type: "IMAGE", mime: "image/svg+xml" },
  webp: { type: "IMAGE", mime: "image/webp" },
  ico: { type: "IMAGE", mime: "image/x-icon" },
  mp4: { type: "VIDEO", mime: "video/mp4" },
  webm: { type: "VIDEO", mime: "video/webm" },
  woff: { type: "FONT", mime: "font/woff" },
  woff2: { type: "FONT", mime: "font/woff2" },
  ttf: { type: "FONT", mime: "font/ttf" },
  otf: { type: "FONT", mime: "font/otf" },
};

const MAX_FILES = 200;
const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12MB per file
const MAX_TOTAL_BYTES = 60 * 1024 * 1024; // 60MB extracted

export interface ProcessedFile {
  relPath: string;
  data: Buffer;
  type: ThemeAssetType;
  mime: string;
  size: number;
}

export interface ProcessedTheme {
  meta: ThemeJson;
  files: ProcessedFile[];
  entryHtmlRel: string;
  previewRel: string | null;
}

export class ThemeValidationError extends Error {}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Reject path traversal and absolute paths; normalise separators. */
function sanitize(entryName: string): string {
  const n = entryName.replace(/\\/g, "/").replace(/^\.\//, "");
  if (n.startsWith("/") || n.split("/").some((seg) => seg === "..")) {
    throw new ThemeValidationError(`Unsafe path in ZIP: ${entryName}`);
  }
  return n;
}

/** If every entry is under a single top folder, strip that prefix. */
function commonPrefix(names: string[]): string {
  const tops = new Set(names.map((n) => n.split("/")[0]));
  if (tops.size === 1) {
    const only = [...tops][0];
    const allNested = names.every((n) => n.includes("/"));
    if (only && allNested) return `${only}/`;
  }
  return "";
}

export function processThemeZip(buffer: Buffer): ProcessedTheme {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new ThemeValidationError("Could not read the ZIP file.");
  }

  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  if (entries.length === 0) throw new ThemeValidationError("The ZIP is empty.");
  if (entries.length > MAX_FILES) {
    throw new ThemeValidationError(`Too many files (max ${MAX_FILES}).`);
  }

  const prefix = commonPrefix(entries.map((e) => sanitize(e.entryName)));

  const files: ProcessedFile[] = [];
  let total = 0;
  let manifestRaw: string | null = null;

  for (const entry of entries) {
    const rel = sanitize(entry.entryName).slice(prefix.length);
    if (!rel || rel.startsWith("__MACOSX") || rel.endsWith(".DS_Store")) continue;

    const e = ext(rel);
    const allowed = ALLOWED_EXT[e];
    if (!allowed) {
      throw new ThemeValidationError(`Unsupported file type: .${e || "?"} (${rel})`);
    }

    const data = entry.getData();
    if (data.length > MAX_FILE_BYTES) {
      throw new ThemeValidationError(`${rel} exceeds the 12MB per-file limit.`);
    }
    total += data.length;
    if (total > MAX_TOTAL_BYTES) {
      throw new ThemeValidationError("Theme exceeds the 60MB total size limit.");
    }

    if (rel.toLowerCase() === "theme.json") {
      manifestRaw = data.toString("utf8");
    }

    files.push({ relPath: rel, data, type: allowed.type, mime: allowed.mime, size: data.length });
  }

  if (!manifestRaw) {
    throw new ThemeValidationError("theme.json is missing from the ZIP.");
  }

  let metaParsed: ThemeJson;
  try {
    metaParsed = themeJsonSchema.parse(JSON.parse(manifestRaw));
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      throw new ThemeValidationError("theme.json failed validation.");
    }
    throw new ThemeValidationError("theme.json is not valid JSON.");
  }

  const entryHtmlRel = metaParsed.entry || "index.html";
  const hasEntry = files.some((f) => f.relPath.toLowerCase() === entryHtmlRel.toLowerCase());
  if (!hasEntry) {
    throw new ThemeValidationError(`Entry file "${entryHtmlRel}" not found in ZIP.`);
  }

  const previewRel =
    metaParsed.preview && files.some((f) => f.relPath === metaParsed.preview)
      ? metaParsed.preview
      : files.find((f) => /^preview\.(png|jpg|jpeg|svg|webp)$/i.test(f.relPath))?.relPath ?? null;

  return { meta: metaParsed, files, entryHtmlRel, previewRel };
}
