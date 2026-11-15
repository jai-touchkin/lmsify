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

function lastLectureKey(courseId: string) {
  return `${PREFIX}last:${courseId}`;
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

/**
 * The lecture the user last opened in a course. Powers the "Resume" button on
 * My Learning and on the course sidebar, so a returning student lands on the
 * lecture they were watching rather than lecture 1.
 */
export function getLastLecture(courseId: string): string | null {
  try {
    return localStorage.getItem(lastLectureKey(courseId));
  } catch {
    return null;
  }
}

export function setLastLecture(courseId: string, lectureId: string): void {
  try {
    localStorage.setItem(lastLectureKey(courseId), lectureId);
  } catch {
    // quota / private mode — Resume just falls back to the first lecture.
  }
}