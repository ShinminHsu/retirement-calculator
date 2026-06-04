import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "./types";
import { clearState, loadState, saveState } from "./lib/storage";

// Central state hook: loads from localStorage, persists on change.
export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  // Debounced persistence so slider drags don't thrash localStorage.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveState(state), 200);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state]);

  const update = useCallback((patch: (draft: AppState) => void) => {
    setState((prev) => {
      const next: AppState = structuredClone(prev);
      patch(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(clearState());
  }, []);

  return { state, setState, update, reset };
}
