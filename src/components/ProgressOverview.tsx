import React from 'react';
import { Target, Rocket, TrendingDown, Trophy } from 'lucide-react';
import { Statistics } from '../types';
import { formatWeight, formatWeightLoss, formatPercentage } from '../utils/calculations';

interface ProgressOverviewProps {
  stats: Statistics;
  targetWeight: number;
}

const ProgressOverviewComponent: React.FC<ProgressOverviewProps> = ({ stats, targetWeight }) => {
  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="hero-panel rounded-3xl p-8 md:p-10 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-white/70 font-semibold mb-3">Progress Ledger</div>
            <h1 className="font-display text-3xl md:text-5xl font-black mb-2">Your Journey</h1>
            <p className="text-white/80 text-lg">
              {stats.progress.daysRemaining} days to go
            </p>
          </div>
          {stats.target.onTrack && (
            <div className="hero-chip px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold">
              On Track
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Current</div>
            <div className="font-display text-4xl md:text-5xl font-black">{formatWeight(stats.current.weight)}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Goal</div>
            <div className="font-display text-4xl md:text-5xl font-black">{formatWeight(targetWeight)}</div>
          </div>
          <div className="hidden md:block">
            <div className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Momentum</div>
            <div className="font-display text-4xl md:text-5xl font-black">
              {formatWeightLoss(stats.averages.weekly)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-white/80 font-medium">Progress</span>
            <span className="font-black font-display text-lg">{formatPercentage(stats.progress.percentageComplete)}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(stats.progress.percentageComplete, 100)}%`,
                backgroundColor: 'var(--accent-3)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Lost */}
        <div className="stat-card p-6 group transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[var(--ink-muted)] text-xs uppercase tracking-[0.2em] font-bold">Weight Lost</div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)' }}
            >
              <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="font-display text-3xl font-black text-[var(--ink)] mb-1">
            {formatWeight(stats.progress.totalLost)}
          </div>
          <div className="text-sm text-[var(--ink-muted)]">
            {formatPercentage(stats.progress.percentageComplete)} complete
          </div>
        </div>

        {/* Remaining */}
        <div className="stat-card p-6 group transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[var(--ink-muted)] text-xs uppercase tracking-[0.2em] font-bold">To Go</div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--accent-3) 0%, var(--accent) 100%)' }}
            >
              <Rocket className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="font-display text-3xl font-black text-[var(--ink)] mb-1">
            {formatWeight(stats.progress.remaining)}
          </div>
          <div className="text-sm text-[var(--ink-muted)]">
            {stats.progress.daysRemaining} days remaining
          </div>
        </div>

        {/* Avg Loss Rate */}
        <div className="stat-card p-6 group transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[var(--ink-muted)] text-xs uppercase tracking-[0.2em] font-bold">Weekly Avg</div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--accent-2) 0%, #2f4858 100%)' }}
            >
              <TrendingDown className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="font-display text-3xl font-black text-[var(--ink)] mb-1">
            {formatWeightLoss(stats.averages.weekly)}
          </div>
          <div className="text-sm text-[var(--ink-muted)]">
            {formatWeightLoss(stats.averages.daily)}/day
          </div>
        </div>
      </div>

      {/* Projection Card */}
      <div className="card-floating rounded-3xl p-6 border-l-4 transition-all duration-300"
        style={{ borderLeftColor: 'var(--accent-2)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-display text-xl mb-3 flex items-center gap-2.5">
              {stats.target.onTrack ? (
                <>
                  <Trophy className="w-6 h-6 text-[var(--accent-3)]" strokeWidth={2.5} />
                  <span>You're ahead of schedule!</span>
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6 text-[var(--accent)]" strokeWidth={2.5} />
                  <span>Time to push harder!</span>
                </>
              )}
            </h3>
            <p className="text-[var(--ink-muted)] mb-4 text-base">
              At your current pace, you'll reach your goal on{' '}
              <span className="font-black font-display text-[var(--ink)] text-lg">{stats.target.projectedEndDate}</span>
            </p>
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium accent-pill">
              {stats.target.onTrack
                ? `🚀 ${Math.abs(Math.round(stats.target.daysAheadBehind))} days ahead of target!`
                : `⚡ Increase pace by ${formatWeightLoss(
                  Math.abs(stats.target.requiredWeeklyLoss - stats.averages.weekly)
                )}/week`}
            </div>
          </div>
          <div className="hidden sm:flex w-20 h-20 rounded-2xl items-center justify-center ml-4 shadow-xl border border-[color:var(--border-subtle)] bg-[var(--paper-2)]">
            {stats.target.onTrack ? (
              <Trophy className="w-10 h-10 text-[var(--accent-2)]" strokeWidth={2} />
            ) : (
              <Rocket className="w-10 h-10 text-[var(--accent)]" strokeWidth={2} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ProgressOverview = React.memo(ProgressOverviewComponent);
