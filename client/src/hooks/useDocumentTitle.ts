import { useEffect } from "react";

const SUFFIX = "Lmsify";

/**
 * Sets `document.title` for the current page. This is an SPA with no
 * server-rendered head, so without it every route shares the one title from
 * `index.html` — which makes browser history and open tabs unreadable.
 *
 * Deliberately no restore-on-unmount: the next page sets its own title, and
 * restoring the previous one during a navigation just races the incoming
 * page's effect. Pass `null` while data is loading to leave the title alone.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    document.title = title === SUFFIX ? SUFFIX : `${title} · ${SUFFIX}`;
  }, [title]);
}
