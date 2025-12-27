import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAchievements, getAchievementStats, loadAchievements } from '../achievementService';
import { WeightEntry, TargetData, Statistics } from '../../types';

beforeEach(() => {
  vi.clearAllMocks();
  const localStorageMock: Record<string, string> = {};

  (localStorage.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
    return localStorageMock[key] || null;
  });

  (localStorage.setItem as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string, value: string) => {
    localStorageMock[key] = value;
  });
});

describe('getAchievementStats', () => {
  it('should calculate achievement statistics correctly', () => {
    const achievements = loadAchievements();

    // Unlock a few achievements for testing
    achievements[0].isUnlocked = true;
    achievements[1].isUnlocked = true;
    achievements[5].isUnlocked = true;

    const stats = getAchievementStats(achievements);

    expect(stats.total).toBe(achievements.length);
    expect(stats.unlocked).toBe(3);
    expect(stats.percentComplete).toBeCloseTo((3 / achievements.length) * 100, 2);
  });

  it('should calculate category stats correctly', () => {
    const achievements = loadAchievements();
    const stats = getAchievementStats(achievements);

    expect(stats.byCategory).toHaveProperty('milestone');
    expect(stats.byCategory).toHaveProperty('consistency');
    expect(stats.byCategory).toHaveProperty('progress');
    expect(stats.byCategory).toHaveProperty('special');
  });
});

describe('checkAchievements', () => {
  const mockEntries: WeightEntry[] = [
    { date: '2025-01-01', weekDay: 'Wednesday', weight: 100, changePercent: 0, changeKg: 0, dailyChange: 0 },
    { date: '2025-01-08', weekDay: 'Wednesday', weight: 99, changePercent: -1, changeKg: -1, dailyChange: -0.14 },
  ];

  const mockTargetData: TargetData = {
    startDate: '2025-01-01',
    startWeight: 100,
    endDate: '2025-07-01',
    endWeight: 80,
    totalDuration: 181,
    totalKg: 20,
    height: 170,
  };

  const mockStats: Statistics = {
    current: { weight: 99, bmi: 34.26, bmiCategory: 'Obese' },
    progress: {
      totalLost: 1,
      percentageComplete: 5,
      daysElapsed: 7,
      daysRemaining: 174,
      remaining: 19,
    },
    averages: { daily: -0.14, weekly: -1, monthly: -4 },
    target: {
      requiredDailyLoss: 0.11,
      requiredWeeklyLoss: 0.77,
      projectedEndDate: '2025-08-01',
      onTrack: false,
      daysAheadBehind: -10,
    },
    performance: {
      bestDay: { date: '2025-01-08', loss: -1 },
      bestWeek: { weekStart: '2025-01-01', loss: -1 },
      longestStreak: 2,
    },
  };

  it('should unlock first_entry achievement', () => {
    const { newlyUnlocked } = checkAchievements(mockEntries, mockTargetData, mockStats);

    const firstEntry = newlyUnlocked.find(a => a.id === 'first_entry');
    expect(firstEntry).toBeDefined();
  });

  it('should unlock lost_1kg achievement when 1kg is lost', () => {
    const { newlyUnlocked } = checkAchievements(mockEntries, mockTargetData, mockStats);

    const lost1kg = newlyUnlocked.find(a => a.id === 'lost_1kg');
    expect(lost1kg).toBeDefined();
  });

  it('should not unlock achievements twice', () => {
    // First check
    checkAchievements(mockEntries, mockTargetData, mockStats);

    // Second check - should not unlock again
    const { newlyUnlocked } = checkAchievements(mockEntries, mockTargetData, mockStats);

    expect(newlyUnlocked.length).toBe(0);
  });

  it('should count streaks based on unique days and allow yesterday start', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const entries: WeightEntry[] = [
      { date: twoDaysAgo.toISOString().split('T')[0], weekDay: 'Monday', weight: 100, changePercent: 0, changeKg: 0, dailyChange: 0 },
      { date: yesterday.toISOString().split('T')[0], weekDay: 'Tuesday', weight: 99, changePercent: -1, changeKg: -1, dailyChange: -0.5 },
    ];

    const { newlyUnlocked } = checkAchievements(entries, mockTargetData, mockStats);
    const weekStreak = newlyUnlocked.find(a => a.id === 'week_streak');
    expect(weekStreak).toBeUndefined();
  });

  it('should only count early entries when recordedAt is present', () => {
    const entries: WeightEntry[] = Array.from({ length: 10 }).map((_, i) => ({
      date: `2025-01-${(i + 1).toString().padStart(2, '0')}`,
      weekDay: 'Wednesday',
      weight: 100 - i,
      changePercent: 0,
      changeKg: 0,
      dailyChange: 0,
      recordedAt: `2025-01-${(i + 1).toString().padStart(2, '0')}T08:00`,
    }));

    const { newlyUnlocked } = checkAchievements(entries, mockTargetData, mockStats);
    const earlyBird = newlyUnlocked.find(a => a.id === 'early_bird');
    expect(earlyBird).toBeDefined();
  });
});
