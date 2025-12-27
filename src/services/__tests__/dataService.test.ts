import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLastEntryDate } from '../dataService';
import { STORAGE_KEYS } from '../storage';
import { WeightEntry } from '../../types';

describe('updateLastEntryDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear last entry date when no entries exist', () => {
    updateLastEntryDate([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.LAST_ENTRY_DATE);
  });

  it('should store the latest entry date', () => {
    const entries: WeightEntry[] = [
      { date: '2025-01-01', weekDay: 'Wednesday', weight: 100, changePercent: 0, changeKg: 0, dailyChange: 0 },
      { date: '2025-01-10', weekDay: 'Friday', weight: 98, changePercent: -2, changeKg: -2, dailyChange: -0.2 },
      { date: '2025-01-05', weekDay: 'Sunday', weight: 99, changePercent: -1, changeKg: -1, dailyChange: -0.2 },
    ];

    updateLastEntryDate(entries);

    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.LAST_ENTRY_DATE, '2025-01-10');
  });
});
