import { LocalFileSystemStorageProvider } from "./local-provider";
import type { StorageProvider } from "./types";

export * from "./types";
export * from "./local-provider";

let defaultProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!defaultProvider) {
    defaultProvider = new LocalFileSystemStorageProvider();
  }
  return defaultProvider;
}
