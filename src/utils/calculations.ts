import { WeightEntry, TargetData, Statistics, BMICategory } from '../types';
import { differenceInDays, addDays, format } from 'date-fns';
import { parseDateFlexible } from './dateUtils';

export const BMI_CATEGORIES: BMICategory[] = [
  { category: 'Underweight', min: 0, max: 18.5, color: '#7AA2C7' },
  { category: 'Normal', min: 18.5, max: 24.9, color: '#7FB38A' },
  { category: 'Overweight', min: 25, max: 29.9, color: '#F2CC8F' },
  { category: 'Obese', min: 30, max: 39.9, color: '#E07A5F' },
  { category: 'Extremely Obese', min: 40, max: 100, color: '#B55A4A' },
];

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): string {
  for (let i = 0; i < BMI_CATEGORIES.length; i++) {
    const cat = BMI_CATEGORIES[i];
    if (i === BMI_CATEGORIES.length - 1) {
      // Last category (Extremely Obese) - no upper limit
      if (bmi >= cat.min) return cat.category;
    } else {
      // All other categories
      if (bmi >= cat.min && bmi < cat.max) return cat.category;
    }
  }
  return 'Unknown';
}

export function getBMIColor(bmi: number): string {
  const category = BMI_CATEGORIES.find(cat => bmi >= cat.min && bmi < cat.max)
    ?? BMI_CATEGORIES.find((cat, index) => index === BMI_CATEGORIES.length - 1 && bmi >= cat.min);
  return category?.color || '#9CA3AF';
}

export function calculateStatistics(
  entries: WeightEntry[],
  targetData: TargetData
): Statistics {
  if (entries.length === 0) {
    throw new Error('No weight entries available');
  }

  const sortedEntries = [...entries]
    .map(entry => ({
      ...entry,
      dateObj: parseDateFlexible(entry.date),
    }))
    .filter(entry => entry.dateObj !== null)
    .sort((a, b) => (a.dateObj as Date).getTime() - (b.dateObj as Date).getTime());

  if (sortedEntries.length === 0) {
    throw new Error('No valid weight entries available');
  }

  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const currentWeight = lastEntry.weight;

  // Current metrics
  const bmi = calculateBMI(currentWeight, targetData.height);
  const bmiCategory = getBMICategory(bmi);

  // Progress metrics
  const totalLost = targetData.startWeight - currentWeight;
  const remaining = currentWeight - targetData.endWeight;
  const percentageComplete = (totalLost / targetData.totalKg) * 100;

  const startDate = parseDateFlexible(targetData.startDate) ?? (sortedEntries[0].dateObj as Date);
  const endDate = parseDateFlexible(targetData.endDate) ?? (sortedEntries[sortedEntries.length - 1].dateObj as Date);
  const currentDate = lastEntry.dateObj as Date;

  const daysElapsed = differenceInDays(currentDate, startDate);
  const daysRemaining = differenceInDays(endDate, currentDate);

  // Average calculations
  const dailyAvg = totalLost / Math.max(daysElapsed, 1);
  const weeklyAvg = dailyAvg * 7;
  const monthlyAvg = dailyAvg * 30;

  // Target calculations
  const requiredDailyLoss = remaining / Math.max(daysRemaining, 1);
  const requiredWeeklyLoss = requiredDailyLoss * 7;

  // Projection
  const daysNeeded = remaining / Math.max(dailyAvg, 0.01);
  const projectedEndDate = format(addDays(currentDate, Math.ceil(daysNeeded)), 'MMM dd, yyyy');
  const daysAheadBehind = targetData.totalDuration - (daysElapsed + daysNeeded);
  const onTrack = daysAheadBehind >= 0;

  // Performance metrics
  const bestDay = sortedEntries.reduce((best, entry) => {
    return entry.dailyChange < best.loss ? { date: entry.date, loss: entry.dailyChange } : best;
  }, { date: sortedEntries[0]?.date || targetData.startDate, loss: 0 });

  // Weekly performance
  const weeklyData = groupEntriesByWeek(sortedEntries);
  const bestWeek = weeklyData.reduce((best, week) => {
    return week.totalLoss < best.loss ? { weekStart: week.startDate, loss: week.totalLoss } : best;
  }, { weekStart: weeklyData[0]?.startDate || targetData.startDate, loss: 0 });

  // Streak calculation (consecutive days with weight loss)
  let currentStreak = 0;
  let longestStreak = 0;
  for (let i = 1; i < sortedEntries.length; i++) {
    if (sortedEntries[i].weight < sortedEntries[i - 1].weight) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    current: {
      weight: currentWeight,
      bmi,
      bmiCategory,
    },
    progress: {
      totalLost,
      percentageComplete,
      daysElapsed,
      daysRemaining,
      remaining,
    },
    averages: {
      daily: dailyAvg,
      weekly: weeklyAvg,
      monthly: monthlyAvg,
    },
    target: {
      requiredDailyLoss,
      requiredWeeklyLoss,
      projectedEndDate,
      onTrack,
      daysAheadBehind,
    },
    performance: {
      bestDay,
      bestWeek,
      longestStreak,
    },
  };
}

interface WeeklyData {
  startDate: string;
  totalLoss: number;
  entries: WeightEntry[];
}

function groupEntriesByWeek(entries: WeightEntry[]): WeeklyData[] {
  const weeks: WeeklyData[] = [];
  let currentWeek: WeightEntry[] = [];
  let weekStart = entries[0]?.date;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const weekStartDate = weekStart ? parseDateFlexible(weekStart) : null;
    const entryDate = parseDateFlexible(entry.date);
    if (!weekStartDate || !entryDate) continue;
    const daysDiff = differenceInDays(entryDate, weekStartDate);

    if (daysDiff >= 7) {
      if (currentWeek.length > 0) {
        const startWeight = currentWeek[0].weight;
        const endWeight = currentWeek[currentWeek.length - 1].weight;
        weeks.push({
          startDate: weekStart,
          totalLoss: startWeight - endWeight,
          entries: currentWeek,
        });
      }
      currentWeek = [entry];
      weekStart = entry.date;
    } else {
      currentWeek.push(entry);
    }
  }

  // Add last week
  if (currentWeek.length > 0) {
    const startWeight = currentWeek[0].weight;
    const endWeight = currentWeek[currentWeek.length - 1].weight;
    weeks.push({
      startDate: weekStart,
      totalLoss: startWeight - endWeight,
      entries: currentWeek,
    });
  }

  return weeks;
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function formatChange(kg: number): string {
  const sign = kg > 0 ? '+' : '';
  return `${sign}${kg.toFixed(2)} kg`;
}

// Format weight loss (positive values shown with minus since it's loss)
export function formatWeightLoss(kg: number): string {
  const sign = kg > 0 ? '-' : '+';
  return `${sign}${Math.abs(kg).toFixed(2)} kg`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
