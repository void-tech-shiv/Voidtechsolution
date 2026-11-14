import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { LocalFileSystemStorageProvider } from "@/lib/storage/local-provider";

describe("Task 10.1.9: LocalFileSystemStorageProvider & Traversal Defenses", () => {
  const testStorageDir = path.resolve(process.cwd(), "tmp-test-storage");
  let provider: LocalFileSystemStorageProvider;

  beforeAll(async () => {
    await fs.mkdir(testStorageDir, { recursive: true });
    provider = new LocalFileSystemStorageProvider(testStorageDir, "/test-uploads");
  });

  afterAll(async () => {
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch {
      // Best effort
    }
  });

  it("uploads a file buffer and produces a safe publicUrl and storageKey", async () => {
    const buffer = Buffer.from("test image content");
    const result = await provider.upload({
      buffer,
      filename: "sample.webp",
      mimeType: "image/webp",
    });

    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.mimeType).toBe("image/webp");
    expect(result.storageKey).toContain(".webp");
    expect(result.publicUrl).toContain("/test-uploads/");

    const exists = await provider.exists(result.storageKey);
    expect(exists).toBe(true);
  });

  it("strictly rejects directory traversal attempts using ..", async () => {
    const buffer = Buffer.from("malicious payload");
    await expect(
      provider.upload({
        buffer,
        filename: "evil.png",
        mimeType: "image/png",
        storageKey: "../../../etc/passwd",
      })
    ).rejects.toThrow(/Path traversal detected/);
  });

  it("strictly rejects null-byte injection attempts", async () => {
    const buffer = Buffer.from("malicious payload");
    await expect(
      provider.upload({
        buffer,
        filename: "evil.png",
        mimeType: "image/png",
        storageKey: "valid/dir/\0evil.php",
      })
    ).rejects.toThrow(/Path traversal detected/);
  });

  it("deletes a previously uploaded file cleanly", async () => {
    const buffer = Buffer.from("file to delete");
    const result = await provider.upload({
      buffer,
      filename: "delete-me.webp",
      mimeType: "image/webp",
    });

    const deleted = await provider.delete(result.storageKey);
    expect(deleted).toBe(true);

    const existsAfter = await provider.exists(result.storageKey);
    expect(existsAfter).toBe(false);

    // Deleting again returns false
    const deletedAgain = await provider.delete(result.storageKey);
    expect(deletedAgain).toBe(false);
  });
});
