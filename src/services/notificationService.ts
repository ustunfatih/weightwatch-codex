import toast from 'react-hot-toast';
import { WeightEntry, TargetData, Statistics } from '../types';
import { STORAGE_KEYS, readJSON, writeJSON } from './storage';
import { calculateEntryStreak, getUniqueEntryDays } from '../utils/streaks';
import { format } from 'date-fns';

export interface NotificationSettings {
  enabled: boolean;
  time: string;
  skipWeekends: boolean;
  milestoneAlerts: boolean;
  streakAlerts: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '09:00',
  skipWeekends: false,
  milestoneAlerts: true,
  streakAlerts: true,
};

export function getNotificationSettings(): NotificationSettings {
  const saved = readJSON<Partial<NotificationSettings> | null>(STORAGE_KEYS.REMINDER_SETTINGS, null);
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(saved ?? {}),
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  writeJSON(STORAGE_KEYS.REMINDER_SETTINGS, settings);
}

type NotificationPayload = {
  title: string;
  body: string;
  tag: string;
};

export function sendNotification({ title, body, tag }: NotificationPayload): void {
  if (typeof window === 'undefined') return;

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag,
      });
      return;
    }
    if (Notification.permission === 'denied') {
      return;
    }
  }

  toast.success(body || title);
}

function getNotificationHistory(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.NOTIFICATION_HISTORY, []);
}

function saveNotificationHistory(history: string[]): void {
  writeJSON(STORAGE_KEYS.NOTIFICATION_HISTORY, history);
}

export function triggerProgressNotifications(
  entries: WeightEntry[],
  targetData: TargetData,
  stats: Statistics
): void {
  const settings = getNotificationSettings();
  if (!settings.milestoneAlerts && !settings.streakAlerts) return;
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
    return;
  }

  const historySet = new Set(getNotificationHistory());
  const addNotification = (id: string, payload: NotificationPayload) => {
    if (historySet.has(id)) return;
    sendNotification(payload);
    historySet.add(id);
  };

  if (settings.milestoneAlerts) {
    const totalLost = stats.progress.totalLost;
    const lossMilestones = [1, 5, 10, 20];
    lossMilestones.forEach((milestone) => {
      if (totalLost >= milestone) {
        addNotification(`loss-${milestone}`, {
          title: 'Milestone unlocked! 🎯',
          body: `You have lost ${milestone} kg. Keep the momentum going.`,
          tag: `milestone-loss-${milestone}`,
        });
      }
    });

    const progress = stats.progress.percentageComplete;
    const progressMilestones = [25, 50, 75, 100];
    progressMilestones.forEach((milestone) => {
      if (progress >= milestone) {
        addNotification(`progress-${milestone}`, {
          title: 'Goal progress update',
          body: `You are ${milestone}% of the way to your goal.`,
          tag: `milestone-progress-${milestone}`,
        });
      }
    });

    if (stats.progress.remaining > 0 && stats.progress.remaining <= 1) {
      addNotification('near-goal', {
        title: 'Almost there! 🏁',
        body: `Only ${stats.progress.remaining.toFixed(1)} kg left to reach your goal.`,
        tag: 'milestone-near-goal',
      });
    }

    if (stats.progress.remaining <= 0) {
      addNotification('goal-reached', {
        title: 'Goal achieved! 🎉',
        body: `You reached your target weight of ${targetData.endWeight} kg.`,
        tag: 'milestone-goal-achieved',
      });
    }
  }

  if (settings.streakAlerts) {
    const streak = calculateEntryStreak(entries);
    const streakMilestones = [3, 7, 14, 30];
    streakMilestones.forEach((milestone) => {
      if (streak >= milestone) {
        addNotification(`streak-${milestone}`, {
          title: 'Streak milestone',
          body: `You are on a ${milestone}-day streak. Keep it rolling!`,
          tag: `streak-${milestone}`,
        });
      }
    });
  }

  saveNotificationHistory(Array.from(historySet));
}

export function getStreakReminder(entries: WeightEntry[]): NotificationPayload | null {
  const streak = calculateEntryStreak(entries);
  if (streak < 3) return null;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const uniqueDays = getUniqueEntryDays(entries);
  if (uniqueDays.includes(todayKey)) return null;

  return {
    title: 'Keep your streak alive! 🔥',
    body: `You are on a ${streak}-day streak. Log today to keep it going.`,
    tag: 'streak-reminder',
  };
}
