import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { WeightEntry, Statistics } from '../types';
import { STORAGE_KEYS, readJSON, writeJSON, removeKey } from '../services/storage';

interface SmartTipProps {
    entries: WeightEntry[];
    stats: Statistics | null;
}

interface Tip {
    id: string;
    message: string;
    type: 'motivation' | 'insight' | 'reminder' | 'celebration';
    icon: string;
}

export function SmartTips({ entries, stats }: SmartTipProps) {
    const [currentTip, setCurrentTip] = useState<Tip | null>(null);
    const [dismissedTips, setDismissedTips] = useState<string[]>([]);

    useEffect(() => {
        // Load dismissed tips
        const stored = readJSON<string[]>(STORAGE_KEYS.SMART_TIPS, []);
        setDismissedTips(stored);
    }, []);

    useEffect(() => {
        const tip = generateSmartTip(entries, stats, dismissedTips);
        setCurrentTip(tip);
    }, [entries, stats, dismissedTips]);

    const handleDismiss = () => {
        if (currentTip) {
            const updated = [...dismissedTips, currentTip.id];
            setDismissedTips(updated);
            writeJSON(STORAGE_KEYS.SMART_TIPS, updated);
            setCurrentTip(null);
        }
    };

    if (!currentTip) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-2xl p-4 shadow-lg border ${currentTip.type === 'celebration'
                    ? 'bg-[rgba(61,90,128,0.12)] border-[color:var(--accent-2)]'
                    : currentTip.type === 'reminder'
                        ? 'bg-[rgba(224,122,95,0.12)] border-[color:var(--accent)]'
                        : 'bg-[rgba(242,204,143,0.14)] border-[color:var(--accent-3)]'
                    }`}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">{currentTip.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-[var(--accent-2)]" />
                            <span className="text-xs font-semibold text-[var(--ink-muted)] uppercase">
                                {currentTip.type === 'celebration' ? 'Celebration' : 'Tip'}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--ink)]">{currentTip.message}</p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-[rgba(255,255,255,0.6)] rounded-lg transition-colors"
                        aria-label="Dismiss tip"
                    >
                        <X className="w-4 h-4 text-[var(--ink-muted)]" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function generateSmartTip(
    entries: WeightEntry[],
    stats: Statistics | null,
    dismissedTips: string[]
): Tip | null {
    if (entries.length === 0 || !stats) return null;

    const tips: Tip[] = [];

    // Celebration tips
    if (stats.progress.percentageComplete >= 25 && !dismissedTips.includes('milestone-25')) {
        tips.push({
            id: 'milestone-25',
            message: '🎉 Congratulations! You\'ve completed 25% of your weight loss journey! Keep up the amazing work!',
            type: 'celebration',
            icon: '🎊',
        });
    }

    if (stats.progress.percentageComplete >= 50 && !dismissedTips.includes('milestone-50')) {
        tips.push({
            id: 'milestone-50',
            message: '🌟 You\'re halfway there! This is a huge milestone. You\'re doing fantastic!',
            type: 'celebration',
            icon: '⭐',
        });
    }

    if (stats.progress.percentageComplete >= 75 && !dismissedTips.includes('milestone-75')) {
        tips.push({
            id: 'milestone-75',
            message: '🚀 Amazing! You\'re 75% of the way to your goal. The finish line is in sight!',
            type: 'celebration',
            icon: '🏆',
        });
    }

    // Longest streak
    if (stats.performance.longestStreak >= 7 && !dismissedTips.includes('streak-7')) {
        tips.push({
            id: 'streak-7',
            message: `💪 Incredible! You have a ${stats.performance.longestStreak}-day streak. Consistency is key to success!`,
            type: 'celebration',
            icon: '🔥',
        });
    }

    // Insight tips
    if (stats.progress.daysRemaining < 30 && stats.progress.remaining > 5 && !dismissedTips.includes('sprint-finish')) {
        tips.push({
            id: 'sprint-finish',
            message: `⏰ Less than 30 days to your goal date! You need to lose ${stats.progress.remaining.toFixed(1)}kg. Time to focus!`,
            type: 'reminder',
            icon: '⚡',
        });
    }

    if (stats.target.onTrack && stats.averages.weekly > 0.5 && !dismissedTips.includes('ahead-schedule')) {
        tips.push({
            id: 'ahead-schedule',
            message: '🎯 You\'re ahead of schedule! Your current pace is excellent. Consider your calorie intake to maintain healthy progress.',
            type: 'insight',
            icon: '📈',
        });
    }

    if (!stats.target.onTrack && !dismissedTips.includes('behind-schedule')) {
        tips.push({
            id: 'behind-schedule',
            message: `📊 You\'re ${Math.abs(stats.target.daysAheadBehind).toFixed(0)} days behind schedule. Consider increasing your activity or reviewing your diet plan.`,
            type: 'reminder',
            icon: '⚠️',
        });
    }

    // BMI insights
    if (stats.current.bmiCategory === 'Normal' && !dismissedTips.includes('bmi-normal')) {
        tips.push({
            id: 'bmi-normal',
            message: '🎉 Congratulations! Your BMI is now in the "Normal" range. This is great for your health!',
            type: 'celebration',
            icon: '💚',
        });
    }

    // Motivation tips
    const lastEntry = entries[entries.length - 1];
    const daysSinceLastEntry = Math.floor(
        (new Date().getTime() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastEntry >= 3 && !dismissedTips.includes('log-reminder')) {
        tips.push({
            id: 'log-reminder',
            message: '📅 It\'s been a few days since your last weigh-in. Regular tracking helps you stay on track!',
            type: 'reminder',
            icon: '⏰',
        });
    }

    if (entries.length >= 30 && entries.length % 10 === 0 && !dismissedTips.includes(`entries-${entries.length}`)) {
        tips.push({
            id: `entries-${entries.length}`,
            message: `📊 You've logged ${entries.length} weight entries! Your data is getting richer and more valuable.`,
            type: 'celebration',
            icon: '📈',
        });
    }

    // Return the first non-dismissed tip
    return tips.length > 0 ? tips[0] : null;
}

// Export function to reset tips (useful for testing or settings)
export function resetSmartTips() {
    removeKey(STORAGE_KEYS.SMART_TIPS);
}
