import { describe, it, expect } from 'vitest';
import { calculateBMI, getBMICategory, calculateStatistics } from '../calculations';
import { WeightEntry, TargetData } from '../../types';

describe('calculateBMI', () => {
  it('should calculate BMI correctly', () => {
    expect(calculateBMI(70, 170)).toBeCloseTo(24.22, 2);
    expect(calculateBMI(80, 180)).toBeCloseTo(24.69, 2);
    expect(calculateBMI(100, 170)).toBeCloseTo(34.60, 2);
  });

  it('should handle edge cases', () => {
    expect(calculateBMI(0, 170)).toBe(0);
    expect(calculateBMI(70, 0)).toBe(0);
  });
});

describe('getBMICategory', () => {
  it('should categorize underweight correctly', () => {
    expect(getBMICategory(17)).toBe('Underweight');
    expect(getBMICategory(18)).toBe('Underweight');
  });

  it('should categorize normal weight correctly', () => {
    expect(getBMICategory(19)).toBe('Normal');
    expect(getBMICategory(24)).toBe('Normal');
  });

  it('should categorize overweight correctly', () => {
    expect(getBMICategory(26)).toBe('Overweight');
    expect(getBMICategory(29)).toBe('Overweight');
  });

  it('should categorize obese correctly', () => {
    expect(getBMICategory(31)).toBe('Obese');
    expect(getBMICategory(39.5)).toBe('Obese');
  });

  it('should categorize extremely obese correctly', () => {
    expect(getBMICategory(40)).toBe('Extremely Obese');
  });
});

describe('calculateStatistics', () => {
  const mockEntries: WeightEntry[] = [
    {
      date: '2025-01-01',
      weekDay: 'Wednesday',
      weight: 100,
      changePercent: 0,
      changeKg: 0,
      dailyChange: 0,
    },
    {
      date: '2025-01-08',
      weekDay: 'Wednesday',
      weight: 99,
      changePercent: -1,
      changeKg: -1,
      dailyChange: -0.14,
    },
    {
      date: '2025-01-15',
      weekDay: 'Wednesday',
      weight: 98,
      changePercent: -1.01,
      changeKg: -1,
      dailyChange: -0.14,
    },
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

  it('should calculate current weight and BMI', () => {
    const stats = calculateStatistics(mockEntries, mockTargetData);

    expect(stats.current.weight).toBe(98);
    expect(stats.current.bmi).toBeCloseTo(33.91, 2);
    expect(stats.current.bmiCategory).toBe('Obese');
  });

  it('should calculate progress correctly', () => {
    const stats = calculateStatistics(mockEntries, mockTargetData);

    expect(stats.progress.totalLost).toBe(2);
    expect(stats.progress.remaining).toBe(18);
    expect(stats.progress.percentageComplete).toBe(10);
  });

  it('should calculate averages correctly', () => {
    const stats = calculateStatistics(mockEntries, mockTargetData);

    expect(stats.averages.daily).toBeCloseTo(0.14, 2);
    expect(stats.averages.weekly).toBeCloseTo(1, 2);
  });
});
