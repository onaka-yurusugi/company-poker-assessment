"use client";

import { useState, useCallback } from "react";

const readStorage = <T>(key: string, initialValue: T): T => {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readStorage(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          typeof value === "function"
            ? (value as (prev: T) => T)(prev)
            : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // quota超過などのエラーを無視
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
