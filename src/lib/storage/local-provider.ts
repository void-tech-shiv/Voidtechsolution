import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { StorageProvider, StorageProviderType, UploadOptions, UploadResult } from "./types";

/**
 * VOIDTECH SOLUTION — Local FileSystem Storage Provider
 * 
 * Secure development & integration test storage provider writing to public/uploads.
 * Implements strict directory traversal defenses, null-byte rejection, and path confinement.
 */
export class LocalFileSystemStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "LOCAL";
  readonly baseDir: string;
  readonly publicPrefix: string;

  constructor(
    baseDir = path.resolve(process.cwd(), "public", "uploads"),
    publicPrefix = "/uploads"
  ) {
    this.baseDir = path.resolve(baseDir);
    this.publicPrefix = publicPrefix.endsWith("/") ? publicPrefix.slice(0, -1) : publicPrefix;
  }

  /**
   * Sanitizes and verifies that storage key cannot escape the base directory.
   */
  private resolveSafePath(storageKey: string): string {
    if (!storageKey || typeof storageKey !== "string") {
      throw new Error("Invalid storage key: Storage key must be a non-empty string.");
    }

    // Reject null bytes, backslashes (Windows traversal vectors), or URI-encoded path escapes
    if (storageKey.includes("\0") || storageKey.includes("..") || /%2e%2e/i.test(storageKey)) {
      throw new Error(`Security violation: Path traversal detected in storage key: "${storageKey}"`);
    }

    // Normalize forward/backward slashes to OS separator
    const normalizedKey = storageKey.split("/").filter(Boolean).join(path.sep);
    const resolvedPath = path.resolve(this.baseDir, normalizedKey);

    // Confinement assertion
    if (!resolvedPath.startsWith(this.baseDir + path.sep) && resolvedPath !== this.baseDir) {
      throw new Error(`Security violation: Resolved path escapes storage boundary: "${storageKey}"`);
    }

    return resolvedPath;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { buffer, mimeType, filename } = options;

    if (!buffer || buffer.length === 0) {
      throw new Error("Cannot upload empty file buffer.");
    }

    // Generate safe storage key if not explicitly supplied
    let key = options.storageKey;
    if (!key) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const ext = path.extname(filename) || ".webp";
      const randomUuid = crypto.randomUUID();
      key = `${year}/${month}/${randomUuid}${ext.toLowerCase()}`;
    }

    const safeFilePath = this.resolveSafePath(key);

    // Ensure target folder exists
    await fs.mkdir(path.dirname(safeFilePath), { recursive: true });

    // Write file to disk
    await fs.writeFile(safeFilePath, buffer);

    const publicUrl = `${this.publicPrefix}/${key.split(path.sep).join("/")}`;

    return {
      storageKey: key,
      publicUrl,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const safeFilePath = this.resolveSafePath(storageKey);
      await fs.unlink(safeFilePath);
      return true;
    } catch (err: unknown) {
      if (err instanceof Object && "code" in err && err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  getUrl(storageKey: string): string {
    // Validate key before formatting URL
    this.resolveSafePath(storageKey);
    const cleanKey = storageKey.split(path.sep).join("/");
    return `${this.publicPrefix}/${cleanKey}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const safeFilePath = this.resolveSafePath(storageKey);
      await fs.access(safeFilePath);
      return true;
    } catch {
      return false;
    }
  }
}

