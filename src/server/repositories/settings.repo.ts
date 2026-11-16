import { prisma } from "@/lib/prisma";
import type { SiteSetting } from "@prisma/client";

export type SystemSetting = SiteSetting;

/**
 * Baseline fallback settings when database is offline.
 */
const fallbackSettings: Record<string, string> = {
  site_name: "VOIDTECH SOLUTION",
  site_tagline: "Build. Launch. Grow Online.",
  contact_email: "voidtechsolutionsupport@gmail.com",
  enquiry_auto_reply: "true",
  maintenance_mode: "false",
};

/**
 * Retrieves a single site setting value by key, returning a parsed or default value.
 */
export async function getSetting<T = string>(
  key: string,
  defaultValue?: T
): Promise<T | null> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      if (key in fallbackSettings) {
        return fallbackSettings[key] as unknown as T;
      }
      return defaultValue !== undefined ? defaultValue : null;
    }

    try {
      return JSON.parse(setting.value) as T;
    } catch {
      return setting.value as unknown as T;
    }
  } catch (error) {
    console.warn(`[settings.repo] Failed to fetch setting '${key}':`, error);
    if (key in fallbackSettings) {
      return fallbackSettings[key] as unknown as T;
    }
    return defaultValue !== undefined ? defaultValue : null;
  }
}

/**
 * Sets or updates a site setting by key.
 * Write operation strictly throws descriptive errors on failure without leaking credentials.
 */
export async function setSetting(
  key: string,
  value: unknown,
  description?: string
): Promise<SiteSetting> {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);

  try {
    return await prisma.siteSetting.upsert({
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[settings.repo] Write operation failed:", message);
    throw new Error(`Failed to set setting '${key}': Database write operation failed.`);
  }
}

/**
 * Retrieves all site settings as a key-value map.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, string> = { ...fallbackSettings };
    for (const item of settings) {
      map[item.key] = item.value;
    }
    return map;
  } catch (error) {
    console.warn("[settings.repo] Failed to fetch all settings, using fallback:", error);
    return fallbackSettings;
  }
}
