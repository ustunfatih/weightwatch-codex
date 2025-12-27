import { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, readJSON, writeJSON, readString } from '../services/storage';

interface ReminderSettings {
    enabled: boolean;
    time: string; // H H:MM format (24hr)
    skipWeekends: boolean;
}

export function DailyReminder() {
    const [settings, setSettings] = useState<ReminderSettings>(() => {
        const saved = readJSON<ReminderSettings | null>(STORAGE_KEYS.REMINDER_SETTINGS, null);
        return saved || {
            enabled: false,
            time: '09:00',
            skipWeekends: false,
        };
    });

    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check notification permission
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        // Save settings
        writeJSON(STORAGE_KEYS.REMINDER_SETTINGS, settings);
    }, [settings]);

    useEffect(() => {
        if (!settings.enabled || permission !== 'granted') return;

        // Schedule daily reminder check
        const checkReminder = () => {
            const now = new Date();
            const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

            // Skip weekends if set
            if (settings.skipWeekends && (currentDay === 0 || currentDay === 6)) {
                return;
            }

            const [hours, minutes] = settings.time.split(':').map(Number);
            const reminderTime = new Date();
            reminderTime.setHours(hours, minutes, 0, 0);

            // Check if it's within 1 minute of reminder time
            const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());

            if (timeDiff < 60000) { // Within 1 minute
                // Check if already logged today
                const lastEntry = readString(STORAGE_KEYS.LAST_ENTRY_DATE);
                const today = now.toISOString().split('T')[0];

                if (lastEntry !== today) {
                    showNotification();
                }
            }
        };

        // Check every minute
        const interval = setInterval(checkReminder, 60000);
        checkReminder(); // Check immediately

        return () => clearInterval(interval);
    }, [settings, permission]);

    const showNotification = () => {
        if (permission === 'granted') {
            new Notification('Time to weigh in! ⚖️', {
                body: 'Track your progress by recording today\'s weight.',
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'daily-reminder',
            });
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('Notifications not supported in this browser');
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            toast.success('Notifications enabled!');
            setSettings(prev => ({ ...prev, enabled: true }));
        } else {
            toast.error('Notification permission denied');
        }
    };

    const toggleReminder = async () => {
        if (!settings.enabled && permission !== 'granted') {
            await requestPermission();
        } else {
            setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
            toast.success(settings.enabled ? 'Reminders disabled' : 'Reminders enabled');
        }
    };

    return (
        <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--accent-2)] rounded-full flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--ink)]">Daily Reminder</h3>
                        <p className="text-sm text-[var(--ink-muted)]">Never miss a weigh-in</p>
                    </div>
                </div>

                <button
                    onClick={toggleReminder}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.enabled && permission === 'granted'
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--border-subtle)]'
                        }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.enabled && permission === 'granted' ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {settings.enabled && permission === 'granted' && (
                <div className="space-y-4 mt-4 pt-4 border-t border-[color:var(--border-subtle)]">
                    {/* Time Selector */}
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

                    {/* Skip Weekends */}
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
                </div>
            )}

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
