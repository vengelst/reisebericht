"use client";

import { useSyncExternalStore } from "react";

export type ThemeValue = "light" | "dark";

function subscribe(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): ThemeValue {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Reads the current theme from the <html> class and re-renders on change
 * (MutationObserver). SSR-safe: falls back to "dark" on the server.
 */
export function useTheme(): ThemeValue {
  return useSyncExternalStore(subscribe, getSnapshot, () => "dark");
}
