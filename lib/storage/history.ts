export interface StoredAnalysisRecord {
  id: string;
  repoUrl: string;
  mode: string;
  savedAt: string;
}

export const HISTORY_STORAGE_KEY = "codemotion:last-analysis";

export function writeStoredAnalysisRecord(record: StoredAnalysisRecord) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function readStoredAnalysisRecord(): StoredAnalysisRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAnalysisRecord;
  } catch {
    return null;
  }
}
