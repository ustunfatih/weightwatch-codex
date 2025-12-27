import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ProgressOverview } from '../ProgressOverview';
import { Statistics } from '../../types';

describe('ProgressOverview', () => {
  const mockStats: Statistics = {
    current: { weight: 95, bmi: 32.87, bmiCategory: 'Obese' },
    progress: {
      totalLost: 5,
      percentageComplete: 25,
      daysElapsed: 30,
      daysRemaining: 90,
      remaining: 15,
    },
    averages: { daily: -0.17, weekly: -1.17, monthly: -5 },
    target: {
      requiredDailyLoss: 0.17,
      requiredWeeklyLoss: 1.17,
      projectedEndDate: '2025-07-01',
      onTrack: true,
      daysAheadBehind: 0,
    },
    performance: {
      bestDay: { date: '2025-01-15', loss: -0.5 },
      bestWeek: { weekStart: '2025-01-08', loss: -2 },
      longestStreak: 15,
    },
  };

  it('should display current weight', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/95\.0 kg/)).toBeInTheDocument();
  });

  it('should display progress percentage', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/^25\.0%$/)).toBeInTheDocument();
  });

  it('should display total weight lost', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/Weight Lost/)).toBeInTheDocument();
    expect(screen.getByText(/^5\.0 kg$/)).toBeInTheDocument();
  });

  it('should display remaining weight', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/To Go/)).toBeInTheDocument();
    expect(screen.getByText(/15\.0 kg/)).toBeInTheDocument();
  });

  it('should display days remaining', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/90 days to go/)).toBeInTheDocument();
  });

  it('should show on track status when user is on track', () => {
    render(<ProgressOverview stats={mockStats} targetWeight={80} />);

    expect(screen.getByText(/On Track/)).toBeInTheDocument();
  });

  it('should show behind status when user is not on track', () => {
    const behindStats = {
      ...mockStats,
      target: {
        ...mockStats.target,
        onTrack: false,
        daysAheadBehind: -5,
      },
    };

    render(<ProgressOverview stats={behindStats} targetWeight={80} />);

    expect(screen.getByText(/Time to push harder/i)).toBeInTheDocument();
  });
});
