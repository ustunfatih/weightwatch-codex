import { WeightEntry, TargetData, Statistics } from '../types';
import { Achievement, AchievementId, ACHIEVEMENTS } from '../types/achievements';
import { differenceInDays, eachDayOfInterval, getHours, format } from 'date-fns';
import { STORAGE_KEYS, readJSON, writeJSON } from './storage';
import { parseDateFlexible } from '../utils/dateUtils';
import { calculateEntryStreak, getUniqueEntryDays } from '../utils/streaks';

// Load achievements from localStorage
export function loadAchievements(): Achievement[] {
  const stored = readJSON<Achievement[] | null>(STORAGE_KEYS.ACHIEVEMENTS, null);
  if (stored) return stored;

  // Initialize with all achievements locked
  return Object.values(ACHIEVEMENTS).map(achievement => ({
    ...achievement,
    isUnlocked: false,
  }));
}

// Save achievements to localStorage
export function saveAchievements(achievements: Achievement[]): void {
  writeJSON(STORAGE_KEYS.ACHIEVEMENTS, achievements);
}

// Check and unlock new achievements
export function checkAchievements(
  entries: WeightEntry[],
  _targetData: TargetData,
  stats: Statistics
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const currentAchievements = loadAchievements();
  const newlyUnlocked: Achievement[] = [];

  // Helper: Check if achievement is already unlocked
  const isUnlocked = (id: AchievementId): boolean => {
    return currentAchievements.find(a => a.id === id)?.isUnlocked || false;
  };

  // Helper: Unlock achievement
  const unlock = (id: AchievementId): void => {
    const achievement = currentAchievements.find(a => a.id === id);
    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockedAt = new Date().toISOString();
      newlyUnlocked.push(achievement);
    }
  };

  // First Entry
  if (entries.length >= 1 && !isUnlocked('first_entry')) {
    unlock('first_entry');
  }

  // 100 Club
  if (entries.length >= 100 && !isUnlocked('hundred_club')) {
    unlock('hundred_club');
  }

  // Check for consecutive streaks
  const currentStreak = calculateEntryStreak(entries);
  if (currentStreak >= 7 && !isUnlocked('week_streak')) {
    unlock('week_streak');
  }
  if (currentStreak >= 30 && !isUnlocked('month_streak')) {
    unlock('month_streak');
  }

  // Perfect Week (all 7 days this week)
  if (isPerfectWeek(entries) && !isUnlocked('perfect_week')) {
    unlock('perfect_week');
  }

  // Consistency Champion (90%+ consistency)
  const consistency = calculateConsistency(entries);
  if (consistency >= 90 && !isUnlocked('consistency_champion')) {
    unlock('consistency_champion');
  }

  // Weight loss milestones
  const totalLost = stats.progress.totalLost;
  if (totalLost >= 1 && !isUnlocked('lost_1kg')) {
    unlock('lost_1kg');
  }
  if (totalLost >= 5 && !isUnlocked('lost_5kg')) {
    unlock('lost_5kg');
  }
  if (totalLost >= 10 && !isUnlocked('lost_10kg')) {
    unlock('lost_10kg');
  }
  if (totalLost >= 20 && !isUnlocked('lost_20kg')) {
    unlock('lost_20kg');
  }

  // Progress percentage milestones
  const progressPercent = stats.progress.percentageComplete;
  if (progressPercent >= 50 && !isUnlocked('halfway_there')) {
    unlock('halfway_there');
  }
  if (progressPercent >= 100 && !isUnlocked('goal_achieved')) {
    unlock('goal_achieved');
  }

  // Early Bird (10 entries before 9 AM)
  const earlyEntries = countEarlyEntries(entries);
  if (earlyEntries >= 10 && !isUnlocked('early_bird')) {
    unlock('early_bird');
  }

  saveAchievements(currentAchievements);
  return { achievements: currentAchievements, newlyUnlocked };
}

// Check if current week is perfect (all 7 days logged)
function isPerfectWeek(entries: WeightEntry[]): boolean {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const daysThisWeek = eachDayOfInterval({
    start: startOfWeek,
    end: today,
  });

  const daysSet = new Set(getUniqueEntryDays(entries));

  return daysThisWeek.every(day => {
    return daysSet.has(format(day, 'yyyy-MM-dd'));
  });
}

// Count entries logged before 9 AM
function countEarlyEntries(entries: WeightEntry[]): number {
  return entries.filter(entry => {
    if (!entry.recordedAt) return false;
    const entryDate = parseDateFlexible(entry.recordedAt);
    if (!entryDate) return false;
    const hour = getHours(entryDate);
    return hour < 9;
  }).length;
}

// Calculate consistency percentage
function calculateConsistency(entries: WeightEntry[]): number {
  if (entries.length === 0) return 0;

  const uniqueDays = getUniqueEntryDays(entries).sort();
  const firstEntry = parseDateFlexible(uniqueDays[0]);
  if (!firstEntry) return 0;
  const today = new Date();
  const totalDays = differenceInDays(today, firstEntry) + 1;

  const trackedDays = uniqueDays.length;
  return totalDays > 0 ? (trackedDays / totalDays) * 100 : 0;
}

// Get achievement statistics
export function getAchievementStats(achievements: Achievement[]): {
  total: number;
  unlocked: number;
  percentComplete: number;
  byCategory: Record<string, { total: number; unlocked: number }>;
} {
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.isUnlocked).length;
  const percentComplete = total > 0 ? (unlocked / total) * 100 : 0;

  const categories = ['milestone', 'consistency', 'progress', 'special'];
  const byCategory = categories.reduce((acc, category) => {
    const categoryAchievements = achievements.filter(a => a.category === category);
    const categoryUnlocked = categoryAchievements.filter(a => a.isUnlocked).length;
    acc[category] = {
      total: categoryAchievements.length,
      unlocked: categoryUnlocked,
    };
    return acc;
  }, {} as Record<string, { total: number; unlocked: number }>);

  return {
    total,
    unlocked,
    percentComplete,
    byCategory,
  };
}
