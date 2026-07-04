import { useEffect, useState } from "react";

/**
 * Returns `value` after it has remained stable for `delay` ms. Used by the
 * courses search input to avoid firing a query on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
