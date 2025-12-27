import { WeightEntry, TargetData } from '../types';
import { differenceInDays, format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { parseDateFlexible } from '../utils/dateUtils';

export interface MovingAverageData {
  date: string;
  weight: number;
  ma7: number;
  ma14: number;
  ma30: number;
}

export interface TrendAnalysis {
  trend: 'accelerating' | 'steady' | 'slowing' | 'plateauing';
  confidence: number;
  message: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface BodyComposition {
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bmi: number;
}

export interface ComparisonMetric {
  name: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  unit: string;
}

export interface VolatilityStats {
  averageDailyChange: number;
  stdDevDailyChange: number;
  averageAbsoluteChange: number;
}

export interface WeeklyDelta {
  weekStart: string;
  weekEnd: string;
  label: string;
  changeKg: number;
}

export interface ConsistencyStats {
  trackedDays: number;
  totalDays: number;
  consistencyPercent: number;
  longestGap: number;
}

export interface TimeOfDayStats {
  morningAvg: number | null;
  afternoonAvg: number | null;
  eveningAvg: number | null;
  nightAvg: number | null;
  dominantPeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'mixed';
}

export interface ChangePointInsight {
  window: string;
  delta: number;
  direction: 'accelerating' | 'slowing' | 'reversing';
}

// Calculate moving averages
export function calculateMovingAverages(
  entries: WeightEntry[]
): MovingAverageData[] {
  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  return sortedEntries.map((entry, index) => {
    const result: MovingAverageData = {
      date: entry.date,
      weight: entry.weight,
      ma7: entry.weight,
      ma14: entry.weight,
      ma30: entry.weight,
    };

    // Calculate 7-day MA
    if (index >= 6) {
      const last7 = sortedEntries.slice(index - 6, index + 1);
      result.ma7 = last7.reduce((sum, e) => sum + e.weight, 0) / 7;
    }

    // Calculate 14-day MA
    if (index >= 13) {
      const last14 = sortedEntries.slice(index - 13, index + 1);
      result.ma14 = last14.reduce((sum, e) => sum + e.weight, 0) / 14;
    }

    // Calculate 30-day MA
    if (index >= 29) {
      const last30 = sortedEntries.slice(index - 29, index + 1);
      result.ma30 = last30.reduce((sum, e) => sum + e.weight, 0) / 30;
    }

    return result;
  });
}

// Analyze weight loss trend
export function analyzeTrend(entries: WeightEntry[]): TrendAnalysis {
  if (entries.length < 14) {
    return {
      trend: 'steady',
      confidence: 0.5,
      message: 'Not enough data to analyze trend. Keep tracking!',
    };
  }

  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  // Compare recent 7 days vs previous 7 days
  const recent7 = sortedEntries.slice(-7);
  const previous7 = sortedEntries.slice(-14, -7);

  const recentAvgLoss = calculateAverageDailyLoss(recent7);
  const previousAvgLoss = calculateAverageDailyLoss(previous7);

  const difference = recentAvgLoss - previousAvgLoss;

  if (Math.abs(difference) < 0.05) {
    return {
      trend: 'steady',
      confidence: 0.8,
      message: 'Your weight loss is steady and consistent. Great job maintaining your pace!',
    };
  } else if (difference < -0.1) {
    return {
      trend: 'accelerating',
      confidence: 0.85,
      message: `Your weight loss is accelerating! You're losing ${Math.abs(difference).toFixed(2)}kg more per day than last week.`,
    };
  } else if (difference > 0.1) {
    return {
      trend: 'slowing',
      confidence: 0.85,
      message: `Your weight loss is slowing down. Consider reviewing your diet and exercise routine.`,
    };
  } else {
    // Check for plateau (less than 0.5kg loss in 2 weeks)
    const twoWeekLoss = sortedEntries[sortedEntries.length - 14].weight - sortedEntries[sortedEntries.length - 1].weight;
    if (twoWeekLoss < 0.5) {
      return {
        trend: 'plateauing',
        confidence: 0.9,
        message: 'You may be hitting a plateau. Try mixing up your routine to break through!',
      };
    }

    return {
      trend: 'steady',
      confidence: 0.75,
      message: 'Your progress is stable. Keep up the good work!',
    };
  }
}

// Calculate average daily loss for a period
function calculateAverageDailyLoss(entries: WeightEntry[]): number {
  if (entries.length < 2) return 0;

  const startWeight = entries[0].weight;
  const endWeight = entries[entries.length - 1].weight;
  const weightChange = startWeight - endWeight;

  const endDate = parseDateFlexible(entries[entries.length - 1].date) ?? new Date(entries[entries.length - 1].date);
  const startDate = parseDateFlexible(entries[0].date) ?? new Date(entries[0].date);
  const days = differenceInDays(endDate, startDate);

  return days > 0 ? weightChange / days : 0;
}

// Filter entries by date range
export function filterByDateRange(
  entries: WeightEntry[],
  range: DateRangeFilter
): WeightEntry[] {
  const startDate = parseDateFlexible(range.startDate) ?? new Date(range.startDate);
  const endDate = parseDateFlexible(range.endDate) ?? new Date(range.endDate);

  return entries.filter(entry => {
    const entryDate = parseDateFlexible(entry.date) ?? new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
}

// Get predefined date ranges
export function getDateRangePresets(latestDate: string): Record<string, DateRangeFilter> {
  const latest = parseDateFlexible(latestDate) ?? new Date(latestDate);

  return {
    'Last 7 Days': {
      startDate: format(subDays(latest, 7), 'yyyy-MM-dd'),
      endDate: latestDate,
    },
    'Last 30 Days': {
      startDate: format(subDays(latest, 30), 'yyyy-MM-dd'),
      endDate: latestDate,
    },
    'Last 90 Days': {
      startDate: format(subDays(latest, 90), 'yyyy-MM-dd'),
      endDate: latestDate,
    },
    'This Week': {
      startDate: format(startOfWeek(latest), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(latest), 'yyyy-MM-dd'),
    },
  };
}

// Compare two periods
export function comparePerformance(
  currentPeriod: WeightEntry[],
  previousPeriod: WeightEntry[]
): ComparisonMetric[] {
  const metrics: ComparisonMetric[] = [];

  // Average daily loss
  const currentDailyLoss = calculateAverageDailyLoss(currentPeriod);
  const previousDailyLoss = calculateAverageDailyLoss(previousPeriod);
  const dailyLossChange = currentDailyLoss - previousDailyLoss;

  metrics.push({
    name: 'Daily Loss Rate',
    current: Math.abs(currentDailyLoss),
    previous: Math.abs(previousDailyLoss),
    change: dailyLossChange,
    changePercent: previousDailyLoss !== 0 ? (dailyLossChange / Math.abs(previousDailyLoss)) * 100 : 0,
    unit: 'kg/day',
  });

  // Total weight lost
  const currentTotalLoss = currentPeriod.length > 0
    ? currentPeriod[0].weight - currentPeriod[currentPeriod.length - 1].weight
    : 0;
  const previousTotalLoss = previousPeriod.length > 0
    ? previousPeriod[0].weight - previousPeriod[previousPeriod.length - 1].weight
    : 0;

  metrics.push({
    name: 'Total Weight Lost',
    current: currentTotalLoss,
    previous: previousTotalLoss,
    change: currentTotalLoss - previousTotalLoss,
    changePercent: previousTotalLoss !== 0 ? ((currentTotalLoss - previousTotalLoss) / Math.abs(previousTotalLoss)) * 100 : 0,
    unit: 'kg',
  });

  // Consistency (number of entries)
  const currentConsistency = currentPeriod.length;
  const previousConsistency = previousPeriod.length;

  metrics.push({
    name: 'Tracking Consistency',
    current: currentConsistency,
    previous: previousConsistency,
    change: currentConsistency - previousConsistency,
    changePercent: previousConsistency !== 0 ? ((currentConsistency - previousConsistency) / previousConsistency) * 100 : 0,
    unit: 'entries',
  });

  return metrics;
}

// Generate insights based on data
export function generateInsights(
  entries: WeightEntry[],
  targetData: TargetData
): string[] {
  const insights: string[] = [];

  if (entries.length < 7) {
    insights.push('🎯 Keep logging your weight daily for more accurate insights!');
    return insights;
  }

  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  // Trend analysis
  const trend = analyzeTrend(sortedEntries);
  insights.push(`📈 ${trend.message}`);

  // Check for consistency
  const recent30Days = sortedEntries.slice(-30);
  if (recent30Days.length >= 20) {
    insights.push('✅ Excellent tracking consistency! This leads to better results.');
  } else if (recent30Days.length >= 10) {
    insights.push('👍 Good tracking consistency. Try logging more often for better insights.');
  } else {
    insights.push('📅 Track more regularly to unlock detailed insights and patterns.');
  }

  // Weekend vs weekday performance
  const weekdayEntries = sortedEntries.filter(e => {
    const date = parseDateFlexible(e.date) ?? new Date(e.date);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  });
  const weekendEntries = sortedEntries.filter(e => {
    const date = parseDateFlexible(e.date) ?? new Date(e.date);
    const day = date.getDay();
    return day === 0 || day === 6;
  });

  if (weekdayEntries.length >= 5 && weekendEntries.length >= 2) {
    const weekdayLoss = calculateAverageDailyLoss(weekdayEntries);
    const weekendLoss = calculateAverageDailyLoss(weekendEntries);

    if (Math.abs(weekendLoss) < Math.abs(weekdayLoss) * 0.5) {
      insights.push('🎮 Weekend progress is slower. Consider planning weekend activities!');
    } else if (Math.abs(weekendLoss) > Math.abs(weekdayLoss) * 1.5) {
      insights.push('💪 Great weekend discipline! Your weekend routine is working well.');
    }
  }

  // Progress pace
  const currentWeight = sortedEntries[sortedEntries.length - 1].weight;
  const remaining = currentWeight - targetData.endWeight;
  const avgLoss = calculateAverageDailyLoss(sortedEntries);

  if (avgLoss > 0) {
    const daysToGoal = remaining / avgLoss;
    const targetEnd = parseDateFlexible(targetData.endDate) ?? new Date(targetData.endDate);
    if (daysToGoal < differenceInDays(targetEnd, new Date())) {
      insights.push('🚀 You\'re ahead of schedule! At this pace, you\'ll reach your goal early.');
    } else if (daysToGoal > differenceInDays(targetEnd, new Date()) * 1.2) {
      insights.push('⚡ Consider increasing your efforts to stay on track with your goal date.');
    }
  }

  return insights;
}

export function calculateVolatilityStats(entries: WeightEntry[]): VolatilityStats {
  if (entries.length < 2) {
    return {
      averageDailyChange: 0,
      stdDevDailyChange: 0,
      averageAbsoluteChange: 0,
    };
  }

  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  const dailyChanges: number[] = [];
  for (let i = 1; i < sortedEntries.length; i++) {
    const prev = sortedEntries[i - 1];
    const curr = sortedEntries[i];
    const currDate = parseDateFlexible(curr.date) ?? new Date(curr.date);
    const prevDate = parseDateFlexible(prev.date) ?? new Date(prev.date);
    const days = Math.max(1, differenceInDays(currDate, prevDate));
    dailyChanges.push((prev.weight - curr.weight) / days);
  }

  const averageDailyChange = dailyChanges.reduce((sum, v) => sum + v, 0) / dailyChanges.length;
  const averageAbsoluteChange = dailyChanges.reduce((sum, v) => sum + Math.abs(v), 0) / dailyChanges.length;
  const variance = dailyChanges.reduce((sum, v) => sum + Math.pow(v - averageDailyChange, 2), 0) / dailyChanges.length;
  const stdDevDailyChange = Math.sqrt(variance);

  return {
    averageDailyChange,
    stdDevDailyChange,
    averageAbsoluteChange,
  };
}

export function calculateWeeklyDeltas(entries: WeightEntry[]): WeeklyDelta[] {
  if (entries.length < 2) return [];

  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  const weeks = new Map<string, { start: string; end: string; startWeight: number; endWeight: number }>();

  sortedEntries.forEach((entry) => {
    const entryDate = parseDateFlexible(entry.date);
    if (!entryDate) return;
    const weekStart = format(startOfWeek(entryDate), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(entryDate), 'yyyy-MM-dd');
    const key = weekStart;
    const existing = weeks.get(key);
    if (!existing) {
      weeks.set(key, {
        start: weekStart,
        end: weekEnd,
        startWeight: entry.weight,
        endWeight: entry.weight,
      });
    } else {
      existing.endWeight = entry.weight;
    }
  });

  return Array.from(weeks.values()).map((week) => ({
    weekStart: week.start,
    weekEnd: week.end,
    label: format(parseDateFlexible(week.start) ?? new Date(week.start), 'MMM dd'),
    changeKg: week.startWeight - week.endWeight,
  }));
}

export function calculateConsistencyStats(entries: WeightEntry[], startDate: string): ConsistencyStats {
  const start = parseDateFlexible(startDate) ?? new Date(startDate);
  const today = new Date();
  const totalDays = Math.max(1, differenceInDays(today, start) + 1);

  const sortedEntries = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  const trackedDays = sortedEntries.length;
  const consistencyPercent = (trackedDays / totalDays) * 100;

  let longestGap = 0;
  for (let i = 1; i < sortedEntries.length; i++) {
    const prev = parseDateFlexible(sortedEntries[i - 1].date) ?? new Date(sortedEntries[i - 1].date);
    const curr = parseDateFlexible(sortedEntries[i].date) ?? new Date(sortedEntries[i].date);
    const gap = Math.max(0, differenceInDays(curr, prev) - 1);
    longestGap = Math.max(longestGap, gap);
  }

  return {
    trackedDays,
    totalDays,
    consistencyPercent,
    longestGap,
  };
}

export function calculateTimeOfDayStats(entries: WeightEntry[]): TimeOfDayStats {
  const buckets: Record<'morning' | 'afternoon' | 'evening' | 'night', number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  entries.forEach((entry) => {
    if (!entry.recordedAt) return;
    const date = parseDateFlexible(entry.recordedAt);
    if (!date) return;
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) buckets.morning.push(entry.weight);
    else if (hour >= 11 && hour < 16) buckets.afternoon.push(entry.weight);
    else if (hour >= 16 && hour < 22) buckets.evening.push(entry.weight);
    else buckets.night.push(entry.weight);
  });

  const avg = (values: number[]) => values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

  const averages = {
    morning: avg(buckets.morning),
    afternoon: avg(buckets.afternoon),
    evening: avg(buckets.evening),
    night: avg(buckets.night),
  };

  const counts = Object.entries(buckets).map(([key, values]) => ({ key, count: values.length }));
  const most = counts.sort((a, b) => b.count - a.count)[0];
  const dominantPeriod = most && most.count >= 3 ? (most.key as TimeOfDayStats['dominantPeriod']) : 'mixed';

  return {
    morningAvg: averages.morning,
    afternoonAvg: averages.afternoon,
    eveningAvg: averages.evening,
    nightAvg: averages.night,
    dominantPeriod,
  };
}

export function detectChangePoint(entries: WeightEntry[]): ChangePointInsight | null {
  if (entries.length < 28) return null;

  const sorted = [...entries].sort(
    (a, b) => {
      const aDate = parseDateFlexible(a.date) ?? new Date(a.date);
      const bDate = parseDateFlexible(b.date) ?? new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    }
  );

  const recent = sorted.slice(-14);
  const previous = sorted.slice(-28, -14);

  const recentLoss = calculateAverageDailyLoss(recent);
  const previousLoss = calculateAverageDailyLoss(previous);

  const delta = recentLoss - previousLoss;
  if (Math.abs(delta) < 0.05) return null;

  const direction: ChangePointInsight['direction'] =
    delta > 0 ? 'accelerating' : recentLoss < 0 && previousLoss > 0 ? 'reversing' : 'slowing';

  return {
    window: 'Last 14 days vs previous 14 days',
    delta,
    direction,
  };
}
