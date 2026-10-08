// Local test configuration. Stored on-device only (no cloud, no backend).

import { storage } from "@/src/utils/storage";

import { DEFAULT_CONFIG } from "./defaults";
import { STORAGE_KEYS } from "./storage-keys";
import { LabConfig } from "./types";

export { DEFAULT_CONFIG };

export async function loadConfig(): Promise<LabConfig> {
  const saved = await storage.getItem<Partial<LabConfig>>(STORAGE_KEYS.config, {});
  return { ...DEFAULT_CONFIG, ...(saved ?? {}) };
}

export async function saveConfig(config: LabConfig): Promise<boolean> {
  return storage.setItem(STORAGE_KEYS.config, config);
}
