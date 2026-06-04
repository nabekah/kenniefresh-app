/**
 * Railway-compatible local disk storage.
 * Replaces Manus storagePut/storageGet with local filesystem storage.
 * Files are saved to UPLOAD_DIR and served as static files at /uploads/*.
 */
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

// Ensure upload directory exists on startup
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`[Storage] Created upload directory: ${UPLOAD_DIR}`);
  }
}

/**
 * Save a buffer to local disk and return a public URL path.
 * Mirrors the storagePut API: (relKey, data, contentType?) => { key, url }
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType?: string
): Promise<{ key: string; url: string }> {
  ensureUploadDir();
  const safeName = relKey.replace(/[^a-zA-Z0-9._\-/]/g, "_");
  const filePath = path.join(UPLOAD_DIR, safeName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, data as Buffer);
  const url = `/uploads/${safeName}`;
  return { key: safeName, url };
}

/**
 * Get the public URL for a stored file.
 * Mirrors the storageGet API: (relKey) => { key, url }
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const safeName = relKey.replace(/[^a-zA-Z0-9._\-/]/g, "_");
  return { key: safeName, url: `/uploads/${safeName}` };
}

/**
 * Register the /uploads static file serving middleware on the Express app.
 */
export function registerStaticUploads(app: Express): void {
  ensureUploadDir();
  app.use("/uploads", express.static(UPLOAD_DIR));
  console.log(`[Storage] Serving uploads from ${UPLOAD_DIR} at /uploads`);
}
