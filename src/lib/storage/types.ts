/**
 * VOIDTECH SOLUTION — Storage Provider Abstraction
 * 
 * Defines unified interfaces for media asset persistence across
 * local filesystem (development) and future Cloudflare R2 / S3 backends.
 */

export type StorageProviderType = "LOCAL" | "R2";

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  storageKey?: string;
}

export interface UploadResult {
  storageKey: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  readonly type: StorageProviderType;

  /**
   * Uploads a file buffer to storage.
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Deletes a file by storage key.
   * Returns true if deleted, false if not found.
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Resolves the public accessible URL for a given storage key.
   */
  getUrl(storageKey: string): string;

  /**
   * Verifies if a storage key exists in storage.
   */
  exists(storageKey: string): Promise<boolean>;
}
