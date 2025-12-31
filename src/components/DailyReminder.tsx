import { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, readJSON, readString } from '../services/storage';
import { WeightEntry } from '../types';
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendNotification,
  getStreakReminder,
  NotificationSettings,
} from '../services/notificationService';

interface DailyReminderProps {
  entries?: WeightEntry[];
}

export function DailyReminder({ entries }: DailyReminderProps) {
  const [settings, setSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    saveNotificationSettings(settings);
  }, [settings]);

  useEffect(() => {
    const shouldSchedule = settings.enabled || settings.streakAlerts;
    if (!shouldSchedule) return;
    if (permission === 'denied') return;

    const checkReminder = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      if (settings.skipWeekends && (currentDay === 0 || currentDay === 6)) {
        return;
      }

      const [hours, minutes] = settings.time.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());

      if (timeDiff < 60000) {
        const lastEntry = readString(STORAGE_KEYS.LAST_ENTRY_DATE);
        const today = now.toISOString().split('T')[0];

        if (lastEntry !== today) {
          const entriesSource = entries ?? readJSON<WeightEntry[]>(STORAGE_KEYS.WEIGHT_ENTRIES, []);

          if (settings.streakAlerts) {
            const streakReminder = getStreakReminder(entriesSource);
            if (streakReminder) {
              sendNotification(streakReminder);
              return;
            }
          }

          if (settings.enabled) {
            sendNotification({
              title: 'Time to weigh in! ⚖️',
              body: 'Track your progress by recording today\'s weight.',
              tag: 'daily-reminder',
            });
          }
        }
      }
    };

    const interval = setInterval(checkReminder, 60000);
    checkReminder();

    return () => clearInterval(interval);
  }, [entries, settings, permission]);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Notifications enabled!');
      return true;
    }

    toast.error('Notification permission denied');
    return false;
  };

  const toggleReminder = async () => {
    if (!settings.enabled) {
      const granted = permission === 'granted' ? true : await requestPermission();
      if (!granted) return;
      setSettings(prev => ({ ...prev, enabled: true }));
      toast.success('Reminders enabled');
      return;
    }

    setSettings(prev => ({ ...prev, enabled: false }));
    toast.success('Reminders disabled');
  };

  const toggleMilestoneAlerts = async () => {
    const granted = permission === 'granted' ? true : await requestPermission();
    if (!granted) return;
    setSettings(prev => ({ ...prev, milestoneAlerts: !prev.milestoneAlerts }));
    toast.success(settings.milestoneAlerts ? 'Milestone alerts disabled' : 'Milestone alerts enabled');
  };

  const toggleStreakAlerts = async () => {
    const granted = permission === 'granted' ? true : await requestPermission();
    if (!granted) return;
    setSettings(prev => ({ ...prev, streakAlerts: !prev.streakAlerts }));
    toast.success(settings.streakAlerts ? 'Streak alerts disabled' : 'Streak alerts enabled');
  };

  const alertsDisabled = permission === 'denied';

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--accent-2)] rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)]">Notifications</h3>
            <p className="text-sm text-[var(--ink-muted)]">Reminders, streaks, and milestones</p>
          </div>
        </div>

        <button
          onClick={toggleReminder}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.enabled && permission !== 'denied'
            ? 'bg-[var(--accent)]'
            : 'bg-[var(--border-subtle)]'
            }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.enabled && permission !== 'denied' ? 'translate-x-7' : 'translate-x-1'
              }`}
          />
        </button>
      </div>

      <div className="space-y-4 mt-4 pt-4 border-t border-[color:var(--border-subtle)]">
        {(settings.enabled || settings.streakAlerts) && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ink-muted)]" />
                <span className="text-sm text-[var(--ink-muted)]">Reminder Time</span>
              </div>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[color:var(--border-subtle)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--ink-muted)]">Skip weekends</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, skipWeekends: !prev.skipWeekends }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.skipWeekends
                  ? 'bg-[var(--accent-2)]'
                  : 'bg-[var(--border-subtle)]'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.skipWeekends ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--ink-muted)]">Milestone alerts</div>
            <div className="text-xs text-[var(--ink-muted)]">Progress and goal updates</div>
          </div>
          <button
            onClick={toggleMilestoneAlerts}
            disabled={alertsDisabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.milestoneAlerts
              ? 'bg-[var(--accent)]'
              : 'bg-[var(--border-subtle)]'
              } ${alertsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.milestoneAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--ink-muted)]">Streak alerts</div>
            <div className="text-xs text-[var(--ink-muted)]">Keep your streak alive</div>
          </div>
          <button
            onClick={toggleStreakAlerts}
            disabled={alertsDisabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.streakAlerts
              ? 'bg-[var(--accent-2)]'
              : 'bg-[var(--border-subtle)]'
              } ${alertsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.streakAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>

      {permission === 'denied' && (
        <div className="mt-4 p-3 bg-[rgba(224,122,95,0.12)] rounded-xl border border-[color:var(--accent)]">
          <p className="text-sm text-[var(--accent)]">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {!('Notification' in window) && (
        <div className="mt-4 p-3 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)]">
          <p className="text-sm text-[var(--ink-muted)]">
            Notifications are not supported in this browser.
          </p>
        </div>
      )}
    </div>
  );
}
