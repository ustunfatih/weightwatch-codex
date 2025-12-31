import { differenceInDays, format, subDays } from 'date-fns';
import { WeightEntry } from '../types';
import { parseDateFlexible } from './dateUtils';

export function getUniqueEntryDays(entries: WeightEntry[]): string[] {
  const daySet = new Set<string>();

  entries.forEach((entry) => {
    const source = entry.date || entry.recordedAt;
    if (!source) return;
    const parsed = parseDateFlexible(source);
    if (!parsed) return;
    daySet.add(format(parsed, 'yyyy-MM-dd'));
  });

  return Array.from(daySet);
}

export function calculateEntryStreak(entries: WeightEntry[]): number {
  if (entries.length === 0) return 0;

  const uniqueDays = getUniqueEntryDays(entries);
  const sortedDays = uniqueDays
    .map((day) => parseDateFlexible(day))
    .filter((day): day is Date => Boolean(day))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDays.length === 0) return 0;

  const today = new Date();
  const latestEntry = sortedDays[0];

  // If latest entry is not today or yesterday, streak is broken
  const daysSinceLatest = differenceInDays(today, latestEntry);
  if (daysSinceLatest > 1) return 0;

  let streak = 0;
  let checkDate = latestEntry;
  const daysSet = new Set(uniqueDays);

  while (daysSet.has(format(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  return streak;
}
