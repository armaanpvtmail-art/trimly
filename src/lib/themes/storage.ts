import { promises as fs } from "fs";
import path from "path";
import type { ProcessedFile } from "./process";

function uploadRoot(): string {
  const dir = process.env.THEME_UPLOAD_DIR || "public/uploads/themes";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

/** Public URL prefix for a theme's assets (served from /public). */
export function themePublicBase(slug: string): string {
  // THEME_UPLOAD_DIR lives under /public, so strip the leading "public".
  const dir = process.env.THEME_UPLOAD_DIR || "public/uploads/themes";
  const webDir = dir.replace(/^public\/?/, "/");
  const normalized = webDir.startsWith("/") ? webDir : `/${webDir}`;
  return `${normalized}/${slug}`.replace(/\/+/g, "/");
}

export interface WrittenAsset {
  relPath: string;
  diskPath: string;
  url: string;
  type: ProcessedFile["type"];
  mime: string;
  size: number;
}

export async function writeThemeFiles(
  slug: string,
  files: ProcessedFile[],
): Promise<{ folderPath: string; assets: WrittenAsset[] }> {
  const base = path.join(uploadRoot(), slug);
  const publicBase = themePublicBase(slug);
  const assets: WrittenAsset[] = [];

  for (const f of files) {
    const diskPath = path.join(base, f.relPath);
    // Defense-in-depth: ensure the resolved path stays inside the theme folder.
    if (!diskPath.startsWith(base)) continue;
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, f.data);
    assets.push({
      relPath: f.relPath,
      diskPath,
      url: `${publicBase}/${f.relPath}`,
      type: f.type,
      mime: f.mime,
      size: f.size,
    });
  }

  return { folderPath: base, assets };
}

export async function deleteThemeFolder(slug: string): Promise<void> {
  const base = path.join(uploadRoot(), slug);
  try {
    await fs.rm(base, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

/** Read a theme's entry HTML from disk (for the render route). */
export async function readThemeEntry(slug: string, entry: string): Promise<string | null> {
  const base = path.join(uploadRoot(), slug);
  const target = path.join(base, entry);
  if (!target.startsWith(base)) return null;
  try {
    return await fs.readFile(target, "utf8");
  } catch {
    return null;
  }
}
