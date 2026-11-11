import { prisma } from "@/lib/prisma";
import type { SystemSetting } from "@prisma/client";

/**
 * Retrieves a single system setting value by key, returning a parsed or default value.
 */
export async function getSetting<T = string>(
  key: string,
  defaultValue?: T
): Promise<T | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return defaultValue !== undefined ? defaultValue : null;
    }

    try {
      return JSON.parse(setting.value) as T;
    } catch {
      return setting.value as unknown as T;
    }
  } catch (error) {
    console.warn(`[settings.repo] Failed to fetch setting '${key}':`, error);
    return defaultValue !== undefined ? defaultValue : null;
  }
}

/**
 * Sets or updates a system setting by key.
 */
export async function setSetting(
  key: string,
  value: unknown,
  description?: string
): Promise<SystemSetting> {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);

  return await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: stringValue,
      description: description || undefined,
    },
    create: {
      key,
      value: stringValue,
      description: description || null,
    },
  });
}

/**
 * Retrieves all system settings as a key-value map.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const item of settings) {
      map[item.key] = item.value;
    }
    return map;
  } catch (error) {
    console.warn("[settings.repo] Failed to fetch all settings:", error);
    return {};
  }
}
