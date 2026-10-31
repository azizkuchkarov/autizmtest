import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage ustidagi kichik obuna bo'linadigan xotira: ekranlar o'zgarishni darhol ko'radi. */
export function createStore<T>(key: string, initial: T, parse: (raw: string) => T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  AsyncStorage.getItem(key)
    .then((raw) => {
      if (!raw) return;
      value = parse(raw);
      emit();
    })
    .catch(() => {});

  return {
    get: () => value,
    set(next: T) {
      value = next;
      emit();
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
