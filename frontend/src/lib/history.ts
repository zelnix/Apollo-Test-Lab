// Local test history — the most recent 100 attempts, device-only.

import { storage } from "@/src/utils/storage";

import { MAX_HISTORY } from "./scenarios";
import { STORAGE_KEYS } from "./storage-keys";
import { HistoryEntry } from "./types";

export async function loadHistory(): Promise<HistoryEntry[]> {
  return (await storage.getItem<HistoryEntry[]>(STORAGE_KEYS.history, [])) ?? [];
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  const next = [entry, ...current].slice(0, MAX_HISTORY);
  await storage.setItem(STORAGE_KEYS.history, next);
  return next;
}

export async function clearHistory(): Promise<boolean> {
  return storage.setItem(STORAGE_KEYS.history, []);
}

export function genRunId(): string {
  return `ATL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}
