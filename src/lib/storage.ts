import { AppState, SCHEMA_VERSION, defaultState } from "../types";

const STORAGE_KEY = "retirement-calculator/state";

// Merge parsed data over defaults so newly added fields are always present.
// Returns null when the payload is not a recognized state object.
function coerceState(parsed: unknown): AppState | null {
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Partial<AppState>).schemaVersion !== SCHEMA_VERSION
  ) {
    return null;
  }
  const p = parsed as Partial<AppState>;
  const base = defaultState();
  return {
    ...base,
    ...p,
    income: { ...base.income, ...p.income },
    assumptions: { ...base.assumptions, ...p.assumptions },
  } as AppState;
}

// Load state from localStorage. Unknown/missing/corrupt data falls back to the
// default empty state without throwing (schema versioning requirement).
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return coerceState(JSON.parse(raw)) ?? defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or serialization failure — non-fatal for a local tool.
  }
}

// Reset and data control: clear all stored data, return to default empty state.
export function clearState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return defaultState();
}

// Download the current state as a JSON backup file (local-only, no upload).
export function exportStateToFile(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `退休試算備份-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse an imported JSON backup. Throws if the file is not a valid backup.
export async function importStateFromFile(file: File): Promise<AppState> {
  const text = await file.text();
  const state = coerceState(JSON.parse(text));
  if (!state) throw new Error("檔案格式不符或版本不符");
  return state;
}
