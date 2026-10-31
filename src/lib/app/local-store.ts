"use client";

import { useSyncExternalStore } from "react";

/**
 * localStorage'dagi qiymat uchun kichik store (useSyncExternalStore bilan ishlatiladi).
 * Server render va birinchi hydration `fallback` bilan bo'ladi, keyin brauzerdagi qiymat o'qiladi.
 * localStorage yopiq bo'lsa (private rejim) qiymat xotirada saqlanadi.
 */
export function createLocalStore<T>(key: string, fallback: T, parse: (raw: string) => T) {
  const listeners = new Set<() => void>();
  let memory: string | null = null;
  let cacheRaw: string | null | undefined;
  let cacheValue = fallback;

  function readRaw(): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory;
    }
  }

  function get(): T {
    const raw = readRaw();
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      try {
        cacheValue = raw === null ? fallback : parse(raw);
      } catch {
        cacheValue = fallback;
      }
    }
    return cacheValue;
  }

  function set(value: T) {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    memory = raw;
    try {
      localStorage.setItem(key, raw);
    } catch {}
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { get, set, subscribe, getServer: () => fallback };
}

export function useLocalStore<T>(store: ReturnType<typeof createLocalStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

const noopSubscribe = () => () => {};

/** Brauzerda hydration tugaganmi (serverda va birinchi renderda false). */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
