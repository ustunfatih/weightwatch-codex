import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { addWeightEntry } from '../../services/dataService';

// Mock data service
vi.mock('../../services/dataService', () => ({
  fetchWeightData: vi.fn(() => Promise.resolve([
    {
      date: '2025-01-01',
      weekDay: 'Wednesday',
      weight: 100,
      changePercent: 0,
      changeKg: 0,
      dailyChange: 0,
    },
  ])),
  fetchTargetData: vi.fn(() => Promise.resolve({
    startDate: '2025-01-01',
    startWeight: 100,
    endDate: '2025-07-01',
    endWeight: 80,
    totalDuration: 181,
    totalKg: 20,
    height: 170,
  })),
  addWeightEntry: vi.fn((entry) => Promise.resolve([
    {
      date: '2025-01-01',
      weekDay: 'Wednesday',
      weight: 100,
      changePercent: 0,
      changeKg: 0,
      dailyChange: 0,
    },
    {
      date: entry.date || '2025-01-08',
      weekDay: 'Wednesday',
      weight: entry.weight || 99,
      changePercent: -1,
      changeKg: -1,
      dailyChange: -0.14,
    },
  ])),
  updateWeightEntry: vi.fn(),
  deleteWeightEntry: vi.fn(),
  updateTargetData: vi.fn(),
  hasPendingSync: vi.fn(() => false),
  flushPendingSync: vi.fn(() => Promise.resolve(false)),
}));

// Mock achievement service
vi.mock('../../services/achievementService', () => ({
  loadAchievements: vi.fn(() => []),
  checkAchievements: vi.fn(() => ({ achievements: [], newlyUnlocked: [] })),
  getAchievementStats: vi.fn(() => ({ total: 0, unlocked: 0, percentComplete: 0, byCategory: {} })),
  saveAchievements: vi.fn(),
}));

describe('Add Weight Entry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow user to add a new weight entry', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    // Click the floating action button to open modal
    const addButton = screen.getByRole('button', { name: /add weight entry/i });
    await user.click(addButton);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText(/Add Weight Entry/)).toBeInTheDocument();
    });

    // Fill in the form
    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    const dateInput = screen.getByLabelText(/date/i);

    await user.clear(weightInput);
    await user.type(weightInput, '99');

    await user.clear(dateInput);
    await user.type(dateInput, '2025-01-08');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add entry/i });
    await user.click(submitButton);

    // Modal should close and data service should be called
    await waitFor(() => {
      expect(screen.queryByText(/Add Weight Entry/)).not.toBeInTheDocument();
    });

    expect(addWeightEntry).toHaveBeenCalled();
  });

  it('should validate weight input', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add weight entry/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Add Weight Entry/)).toBeInTheDocument();
    });

    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);

    // Try to enter invalid weight (too low)
    await user.clear(weightInput);
    await user.type(weightInput, '30');

    const submitButton = screen.getByRole('button', { name: /add entry/i });
    await user.click(submitButton);

    // Should not call data service when validation fails
    await waitFor(() => {
      expect(addWeightEntry).not.toHaveBeenCalled();
    });
  });
});
