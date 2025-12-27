export interface WeightEntry {
  date: string;
  weekDay: string;
  weight: number;
  changePercent: number;
  changeKg: number;
  dailyChange: number;
  recordedAt?: string; // Local datetime (YYYY-MM-DDTHH:mm) for time-of-day tracking
}

export interface TargetData {
  startDate: string;
  startWeight: number;
  endDate: string;
  endWeight: number;
  totalDuration: number;
  totalKg: number;
  height: number; // in cm
}

export interface Statistics {
  current: {
    weight: number;
    bmi: number;
    bmiCategory: string;
  };
  progress: {
    totalLost: number;
    percentageComplete: number;
    daysElapsed: number;
    daysRemaining: number;
    remaining: number;
  };
  averages: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  target: {
    requiredDailyLoss: number;
    requiredWeeklyLoss: number;
    projectedEndDate: string;
    onTrack: boolean;
    daysAheadBehind: number;
  };
  performance: {
    bestDay: { date: string; loss: number };
    bestWeek: { weekStart: string; loss: number };
    longestStreak: number;
  };
}

export interface BMICategory {
  category: string;
  min: number;
  max: number;
  color: string;
}
