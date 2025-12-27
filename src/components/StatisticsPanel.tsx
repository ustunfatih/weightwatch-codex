import React, { useState } from 'react';
import { format } from 'date-fns';
import { Trophy, Flame, Star, CheckCircle, Zap } from 'lucide-react';
import { Statistics } from '../types';
import { formatWeightLoss } from '../utils/calculations';
import { parseDateFlexible } from '../utils/dateUtils';

interface StatisticsPanelProps {
  stats: Statistics;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const StatisticsPanelComponent: React.FC<StatisticsPanelProps> = ({ stats }) => {
  const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('weekly');

  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const getCurrentValue = () => {
    switch (selectedFrame) {
      case 'daily':
        return stats.averages.daily;
      case 'weekly':
        return stats.averages.weekly;
      case 'monthly':
        return stats.averages.monthly;
    }
  };

  const getRequiredValue = () => {
    switch (selectedFrame) {
      case 'daily':
        return stats.target.requiredDailyLoss;
      case 'weekly':
        return stats.target.requiredWeeklyLoss;
      case 'monthly':
        return stats.target.requiredWeeklyLoss * 4;
    }
  };

  const currentValue = getCurrentValue();
  const requiredValue = getRequiredValue();
  const isAhead = Math.abs(currentValue) >= Math.abs(requiredValue);

  return (
    <div className="card-elevated p-6">
      <div className="eyebrow mb-2">Performance</div>
      <h2 className="font-display text-2xl font-black text-[var(--ink)] mb-6">Performance Breakdown</h2>

      {/* Time Frame Selector */}
      <div className="segmented flex gap-2 mb-6">
        {timeFrames.map((frame) => (
          <button
            key={frame.value}
            onClick={() => setSelectedFrame(frame.value)}
            className={`segmented-btn flex-1 ${selectedFrame === frame.value ? 'active' : ''}`}
          >
            {frame.label}
          </button>
        ))}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-5 border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
          <div className="text-sm text-[var(--ink-muted)] mb-1">Your Actual</div>
          <div className="text-3xl font-bold text-[var(--accent-2)] mb-2">{formatWeightLoss(currentValue)}</div>
          <div className="text-xs text-[var(--ink-muted)]">Average per {selectedFrame.slice(0, -2)}</div>
        </div>

        <div className="rounded-2xl p-5 border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
          <div className="text-sm text-[var(--ink-muted)] mb-1">Target Required</div>
          <div className="text-3xl font-bold text-[var(--accent)] mb-2">
            {formatWeightLoss(requiredValue)}
          </div>
          <div className="text-xs text-[var(--ink-muted)]">Needed per {selectedFrame.slice(0, -2)}</div>
        </div>
      </div>

      {/* Status Indicator */}
      <div
        className={`rounded-2xl p-5 transition-all ${isAhead
          ? 'bg-[rgba(61,90,128,0.12)] border-2 border-[color:var(--accent-2)]'
          : 'bg-[rgba(224,122,95,0.12)] border-2 border-[color:var(--accent)]'
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isAhead
              ? 'bg-[var(--accent-2)]'
              : 'bg-[var(--accent)]'
              }`}
          >
            {isAhead ? (
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex-1">
            <div className="font-bold text-[var(--ink)]">
              {isAhead ? 'Exceeding Target!' : 'Below Target Pace'}
            </div>
            <div className="text-sm text-[var(--ink-muted)]">
              {isAhead
                ? `You're losing ${formatWeightLoss(Math.abs(currentValue) - Math.abs(requiredValue))} more than needed`
                : `Need to increase by ${formatWeightLoss(Math.abs(requiredValue) - Math.abs(currentValue))}`}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Highlights */}
      <div className="mt-6 space-y-3">
        <h3 className="font-bold text-[var(--ink)]">Performance Highlights</h3>

        <div className="rounded-xl p-4 flex items-center gap-3 border border-[color:var(--border-subtle)] bg-[var(--paper-2)] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-[var(--accent-2)]">
            <Trophy className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--ink-muted)]">Best Single Drop</div>
            <div className="font-bold text-[var(--ink)]">
              {formatWeightLoss(Math.abs(stats.performance.bestDay.loss))} on{' '}
              {formatDateFlexible(stats.performance.bestDay.date)}
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 flex items-center gap-3 border border-[color:var(--border-subtle)] bg-[var(--paper-2)] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-[var(--accent-3)]">
            <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--ink-muted)]">Longest Streak</div>
            <div className="font-bold text-[var(--ink)]">{stats.performance.longestStreak} days</div>
          </div>
        </div>

        <div className="rounded-xl p-4 flex items-center gap-3 border border-[color:var(--border-subtle)] bg-[var(--paper-2)] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-[var(--accent)]">
            <Star className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--ink-muted)]">Best Week</div>
            <div className="font-bold text-[var(--ink)]">
              {formatWeightLoss(Math.abs(stats.performance.bestWeek.loss))} (Week of{' '}
              {formatDateFlexible(stats.performance.bestWeek.weekStart)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const StatisticsPanel = React.memo(StatisticsPanelComponent);

function formatDateFlexible(value: string): string {
  const parsed = parseDateFlexible(value);
  if (parsed) return format(parsed, 'MMM dd');
  return value;
}
