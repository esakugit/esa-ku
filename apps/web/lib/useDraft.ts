"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a form's field values mirrored into localStorage as the user types,
 * and restores them on mount. Point: an accidental refresh, a closed tab, a
 * failed submit, or switching tabs and coming back should never throw away
 * what someone already typed into a form. Call the returned `clear()` after
 * a successful submit so the draft doesn't linger and reappear later.
 *
 * Best-effort only — storage can be unavailable (private browsing, quota),
 * in which case this quietly behaves like plain useState.
 */
export function useDraft<T extends Record<string, unknown>>(key: string, initial: T) {
  const storageKey = `esa-draft:${key}`;

  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Restore after mount (not in useState's initializer) so server-rendered
  // and first-client-render markup always match, avoiding a hydration
  // mismatch — the draft "pops in" a moment after the form appears instead.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setValue((v) => ({ ...v, ...JSON.parse(raw) }));
    } catch {
      // ignore
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return; // don't overwrite a saved draft with the blank initial value before restore runs
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // ignore (private browsing / storage full) — draft persistence is a nicety, not load-bearing
    }
  }, [value, storageKey, hydrated]);

  function clear() {
    setValue(initial);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  return [value, setValue, clear] as const;
}
