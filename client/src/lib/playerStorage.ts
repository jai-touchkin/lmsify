/**
 * Tiny typed wrapper around localStorage for the FE-5 player. Keys are
 * namespaced to avoid collisions with other code that might use localStorage.
 *
 * Why a wrapper: the storage API throws on quota exceeded and access denied
 * (Safari private mode, etc.). This wrapper swallows those errors and
 * returns a sentinel, so the player doesn't crash on edge browsers.
 */

const PREFIX = "lmsify:player:";

function key(lectureId: string) {
  return `${PREFIX}progress:${lectureId}`;
}

export function getProgress(lectureId: string): number | null {
  try {
    const raw = localStorage.getItem(key(lectureId));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export function setProgress(lectureId: string, seconds: number): void {
  try {
    localStorage.setItem(key(lectureId), String(seconds));
  } catch {
    // quota / private mode — silently drop. The player still works without
    // resume, just loses progress on refresh.
  }
}

export function clearProgress(lectureId: string): void {
  try {
    localStorage.removeItem(key(lectureId));
  } catch {
    // ignore
  }
}