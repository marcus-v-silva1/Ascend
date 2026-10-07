"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "glowup:storage";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Valor do localStorage sincronizado entre componentes e abas. No servidor, usa o padrão. */
export function useLocalStorage<T>(key: string, fallback: T): [T, (value: T) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    const handler = (e: Event) => {
      if (e instanceof StorageEvent ? e.key === key : (e as CustomEvent).detail === key) onChange();
    };
    window.addEventListener("storage", handler);
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(EVENT, handler);
    };
  }, [key]);

  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

  let value = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }

  const set = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // armazenamento indisponível: a mudança vale só até recarregar
      }
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    [key],
  );

  return [value, set];
}
