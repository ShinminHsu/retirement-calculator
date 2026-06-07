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
  const merged = {
    ...base,
    ...p,
    income: { ...base.income, ...p.income },
    assumptions: { ...base.assumptions, ...p.assumptions },
  } as AppState;

  // Migrate the old single guaranteed-income field (勞保+勞退 combined) to the
  // split 勞保/勞退 model. Preserve the total by parking it under 勞保 with its
  // old start age; the user can re-split it in the UI.
  const legacy = (p.assumptions ?? {}) as {
    guaranteedMonthlyIncome?: number;
    guaranteedIncomeStartAge?: number;
  };
  if (
    legacy.guaranteedMonthlyIncome != null &&
    p.assumptions?.laborInsuranceMonthly == null &&
    p.assumptions?.laborPensionMonthly == null
  ) {
    merged.assumptions.laborInsuranceMonthly = legacy.guaranteedMonthlyIncome;
    merged.assumptions.laborInsuranceStartAge = legacy.guaranteedIncomeStartAge ?? 65;
  }
  return merged;
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
