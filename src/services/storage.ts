export const STORAGE_KEYS = {
  WEIGHT_ENTRIES: 'weightwatch-entries',
  TARGET_DATA: 'weightwatch-target',
  LAST_ENTRY_DATE: 'weightwatch-last-entry-date',
  ACHIEVEMENTS: 'weightwatch-achievements',
  THEME: 'weightwatch-theme',
  TIMELINE_VIEW: 'weightwatch-timeline-view',
  REMINDER_SETTINGS: 'weightwatch-reminder-settings',
  GOOGLE_SHEET_ID: 'google-sheet-id',
  GOOGLE_SHEETS_SYNC_HASH: 'google-sheets-sync-hash',
  GOOGLE_SHEETS_PENDING_SYNC: 'google-sheets-pending-sync',
  ONBOARDING_COMPLETED: 'weightwatch-onboarding-completed',
  PWA_INSTALL_DISMISSED: 'pwa-install-dismissed',
  SMART_TIPS: 'weightwatch-dismissed-tips',
  NOTIFICATION_HISTORY: 'weightwatch-notification-history',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readString(key: string, fallback = ''): string {
  const stored = localStorage.getItem(key);
  return stored ?? fallback;
}

export function writeString(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}
