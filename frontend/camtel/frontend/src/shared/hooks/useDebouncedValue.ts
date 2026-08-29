import { useEffect, useState } from 'react';

/**
 * Renvoie la valeur apres un delai (debounce) — utilise pour la recherche
 * (cahier des charges section 33 : debounce pour la recherche).
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}