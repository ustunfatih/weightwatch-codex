import { WeightEntry, TargetData } from '../types';
import { STORAGE_KEYS, readJSON, writeJSON, writeString, removeKey } from './storage';
import { googleSheetsService } from './GoogleSheetsService';
import { normalizeRecordedAt, parseDateFlexible, toISODate } from '../utils/dateUtils';

// Mock data based on the Google Sheets
// In production, this would fetch from Google Sheets API
export const mockWeightData: WeightEntry[] = [
  { date: '2025-09-28', weekDay: 'Sunday', weight: 112.35, changePercent: 0, changeKg: 0, dailyChange: 0 },
  { date: '2025-10-04', weekDay: 'Saturday', weight: 112.00, changePercent: -0.31, changeKg: -0.35, dailyChange: -0.06 },
  { date: '2025-10-11', weekDay: 'Saturday', weight: 109.30, changePercent: -2.41, changeKg: -2.70, dailyChange: -0.39 },
  { date: '2025-10-18', weekDay: 'Saturday', weight: 108.45, changePercent: -0.78, changeKg: -0.85, dailyChange: -0.12 },
  { date: '2025-10-25', weekDay: 'Saturday', weight: 105.85, changePercent: -2.40, changeKg: -2.60, dailyChange: -0.37 },
  { date: '2025-11-01', weekDay: 'Saturday', weight: 104.45, changePercent: -1.32, changeKg: -1.40, dailyChange: -0.20 },
  { date: '2025-11-08', weekDay: 'Saturday', weight: 104.00, changePercent: -0.43, changeKg: -0.45, dailyChange: -0.06 },
  { date: '2025-11-15', weekDay: 'Saturday', weight: 102.80, changePercent: -1.15, changeKg: -1.20, dailyChange: -0.17 },
  { date: '2025-11-19', weekDay: 'Wednesday', weight: 102.00, changePercent: -0.78, changeKg: -0.80, dailyChange: -0.20 },
  { date: '2025-11-22', weekDay: 'Saturday', weight: 101.85, changePercent: -0.15, changeKg: -0.15, dailyChange: -0.05 },
  { date: '2025-11-24', weekDay: 'Monday', weight: 101.70, changePercent: -0.15, changeKg: -0.15, dailyChange: -0.07 },
  { date: '2025-11-27', weekDay: 'Thursday', weight: 101.00, changePercent: -0.69, changeKg: -0.70, dailyChange: -0.23 },
  { date: '2025-11-29', weekDay: 'Saturday', weight: 100.30, changePercent: -0.69, changeKg: -0.70, dailyChange: -0.35 },
  { date: '2025-12-03', weekDay: 'Wednesday', weight: 99.70, changePercent: -0.60, changeKg: -0.60, dailyChange: -0.15 },
  { date: '2025-12-06', weekDay: 'Saturday', weight: 98.90, changePercent: -0.80, changeKg: -0.80, dailyChange: -0.27 },
  { date: '2025-12-13', weekDay: 'Saturday', weight: 97.90, changePercent: -1.01, changeKg: -1.00, dailyChange: -0.14 },
  { date: '2025-12-17', weekDay: 'Wednesday', weight: 97.55, changePercent: -0.36, changeKg: -0.35, dailyChange: -0.09 },
  { date: '2025-12-20', weekDay: 'Saturday', weight: 97.10, changePercent: -0.46, changeKg: -0.45, dailyChange: -0.15 },
  { date: '2025-12-22', weekDay: 'Monday', weight: 96.55, changePercent: -0.57, changeKg: -0.55, dailyChange: -0.27 },
  { date: '2025-12-27', weekDay: 'Saturday', weight: 96.65, changePercent: 0.10, changeKg: 0.10, dailyChange: 0.02 },
];

export const mockTargetData: TargetData = {
  startDate: '2025-09-28',
  startWeight: 112.35,
  endDate: '2026-07-31',
  endWeight: 75,
  totalDuration: 307,
  totalKg: 37.35,
  height: 170,
};

// Calculate derived fields for weight entry
function calculateDerivedFields(
  entry: WeightEntry,
  previousEntry: WeightEntry | null
): WeightEntry {
  if (!previousEntry) {
    return {
      ...entry,
      changePercent: 0,
      changeKg: 0,
      dailyChange: 0,
    };
  }

  const changeKg = entry.weight - previousEntry.weight;
  const changePercent = (changeKg / previousEntry.weight) * 100;

  // Calculate days between entries
  const currentDate = parseDateFlexible(entry.date) ?? new Date(entry.date);
  const prevDate = parseDateFlexible(previousEntry.date) ?? new Date(previousEntry.date);
  const daysDiff = Math.max(1, Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)));

  const dailyChange = changeKg / daysDiff;

  return {
    ...entry,
    changePercent,
    changeKg,
    dailyChange,
  };
}

// Recalculate all derived fields for all entries
function recalculateEntries(entries: WeightEntry[]): WeightEntry[] {
  const sorted = [...entries].sort((a, b) => {
    const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
    const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
    return aDate.getTime() - bDate.getTime();
  });

  return sorted.map((entry, index) => {
    const previousEntry = index > 0 ? sorted[index - 1] : null;
    return calculateDerivedFields(entry, previousEntry);
  });
}

async function syncToSheetsIfEnabled(entries: WeightEntry[], targetData: TargetData): Promise<void> {
  try {
    if (!googleSheetsService.isSignedIn()) return;
    if (!googleSheetsService.getSpreadsheetId()) return;
    await googleSheetsService.syncToSheets(entries, targetData);
  } catch (error) {
    console.warn('Google Sheets sync failed:', error);
  }
}

export function updateLastEntryDate(entries: WeightEntry[]): void {
  if (entries.length === 0) {
    removeKey(STORAGE_KEYS.LAST_ENTRY_DATE);
    return;
  }

  const latest = entries.reduce((max, entry) => {
    const entryDate = parseDateFlexible(entry.date) ?? new Date(entry.date);
    const maxDate = parseDateFlexible(max.date) ?? new Date(max.date);
    return entryDate.getTime() > maxDate.getTime() ? entry : max;
  }, entries[0]);

  writeString(STORAGE_KEYS.LAST_ENTRY_DATE, latest.date);
}

function normalizeStoredEntries(entries: WeightEntry[]): WeightEntry[] {
  const normalized = entries
    .map((entry) => {
      const isoDate = toISODate(entry.date);
      if (!isoDate) return null;
      const recordedAt = normalizeRecordedAt(isoDate, entry.recordedAt);
      return {
        ...entry,
        date: isoDate,
        recordedAt,
      };
    })
    .filter((entry): entry is WeightEntry => Boolean(entry));

  if (normalized.length !== entries.length) {
    writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, normalized);
  }

  return normalized;
}

function normalizeTargetData(target: TargetData): TargetData {
  const startDate = toISODate(target.startDate) || target.startDate;
  const endDate = toISODate(target.endDate) || target.endDate;
  const normalized = { ...target, startDate, endDate };
  if (startDate !== target.startDate || endDate !== target.endDate) {
    writeJSON(STORAGE_KEYS.TARGET_DATA, normalized);
  }
  return normalized;
}

// Get entries from localStorage or return mock data
function getStoredEntries(): WeightEntry[] {
  const stored = readJSON<WeightEntry[] | null>(STORAGE_KEYS.WEIGHT_ENTRIES, null);
  if (stored) {
    const normalized = normalizeStoredEntries(stored);
    updateLastEntryDate(normalized);
    return normalized;
  }
  // Initialize with mock data if not found
  writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, mockWeightData);
  return mockWeightData;
}

// Get target data from localStorage or return mock data
function getStoredTargetData(): TargetData {
  const stored = readJSON<TargetData | null>(STORAGE_KEYS.TARGET_DATA, null);
  if (stored) return normalizeTargetData(stored);
  // Initialize with mock data if not found
  writeJSON(STORAGE_KEYS.TARGET_DATA, mockTargetData);
  return mockTargetData;
}

export async function fetchWeightData(): Promise<WeightEntry[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return getStoredEntries();
}

export async function fetchTargetData(): Promise<TargetData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return getStoredTargetData();
}

// Add a new weight entry
export async function addWeightEntry(entry: Partial<WeightEntry>): Promise<WeightEntry[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const entries = getStoredEntries();

  // Check if entry with this date already exists
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  if (existingIndex !== -1) {
    throw new Error('An entry for this date already exists');
  }

  const newEntry: WeightEntry = {
    date: entry.date!,
    weekDay: entry.weekDay!,
    weight: entry.weight!,
    changePercent: 0,
    changeKg: 0,
    dailyChange: 0,
    recordedAt: entry.recordedAt || `${entry.date}T${new Date().toTimeString().slice(0, 5)}`,
  };

  entries.push(newEntry);

  // Recalculate all derived fields
  const updatedEntries = recalculateEntries(entries);

  writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, updatedEntries);
  updateLastEntryDate(updatedEntries);
  await syncToSheetsIfEnabled(updatedEntries, getStoredTargetData());
  return updatedEntries;
}

// Update an existing weight entry
export async function updateWeightEntry(date: string, updates: Partial<WeightEntry>): Promise<WeightEntry[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const entries = getStoredEntries();
  const index = entries.findIndex(e => e.date === date);

  if (index === -1) {
    throw new Error('Entry not found');
  }

  // Update the entry
  entries[index] = {
    ...entries[index],
    ...updates,
  };

  // Recalculate all derived fields
  const updatedEntries = recalculateEntries(entries);

  writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, updatedEntries);
  updateLastEntryDate(updatedEntries);
  await syncToSheetsIfEnabled(updatedEntries, getStoredTargetData());
  return updatedEntries;
}

// Delete a weight entry
export async function deleteWeightEntry(date: string): Promise<WeightEntry[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const entries = getStoredEntries();
  const filtered = entries.filter(e => e.date !== date);

  if (filtered.length === entries.length) {
    throw new Error('Entry not found');
  }

  // Recalculate all derived fields
  const updatedEntries = recalculateEntries(filtered);

  writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, updatedEntries);
  updateLastEntryDate(updatedEntries);
  await syncToSheetsIfEnabled(updatedEntries, getStoredTargetData());
  return updatedEntries;
}

// Update target data
export async function updateTargetData(updates: Partial<TargetData>): Promise<TargetData> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const currentTarget = getStoredTargetData();
  const updatedTarget = { ...currentTarget, ...updates };

  writeJSON(STORAGE_KEYS.TARGET_DATA, updatedTarget);
  await syncToSheetsIfEnabled(getStoredEntries(), updatedTarget);
  return updatedTarget;
}

// Future: Google Sheets API integration
// export async function fetchFromGoogleSheets(): Promise<{ entries: WeightEntry[], target: TargetData }> {
//   const SHEET_ID = '1te4QfcgjiMIHYAmRar0EdFyiVeOs2D-lj8lXGE0lqmk';
//   const API_KEY = 'your-api-key';
//   // Implementation here
// }
