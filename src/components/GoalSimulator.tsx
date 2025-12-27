import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, TrendingDown, Check, X } from 'lucide-react';
import { TargetData } from '../types';
import { differenceInDays, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { parseDateFlexible } from '../utils/dateUtils';

interface GoalSimulatorProps {
  currentWeight: number;
  currentTargetData: TargetData;
  onUpdateTarget: (newTarget: Partial<TargetData>) => void;
}

export const GoalSimulator = ({
  currentWeight,
  currentTargetData,
  onUpdateTarget,
}: GoalSimulatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetWeight, setTargetWeight] = useState(currentTargetData.endWeight);
  const [targetDate, setTargetDate] = useState(currentTargetData.endDate);

  // Calculate derived values
  const [calculations, setCalculations] = useState({
    totalToLose: 0,
    daysRemaining: 0,
    requiredDailyLoss: 0,
    requiredWeeklyLoss: 0,
    originalDailyLoss: 0,
    originalWeeklyLoss: 0,
  });

  useEffect(() => {
    // Calculate for new target
    const totalToLose = currentWeight - targetWeight;
    const targetDateValue = parseDateFlexible(targetDate) ?? new Date(targetDate);
    const daysRemaining = differenceInDays(targetDateValue, new Date());
    const requiredDailyLoss = daysRemaining > 0 ? totalToLose / daysRemaining : 0;
    const requiredWeeklyLoss = requiredDailyLoss * 7;

    // Calculate for original target
    const originalTotalToLose = currentWeight - currentTargetData.endWeight;
    const originalEndDate = parseDateFlexible(currentTargetData.endDate) ?? new Date(currentTargetData.endDate);
    const originalDaysRemaining = differenceInDays(originalEndDate, new Date());
    const originalDailyLoss =
      originalDaysRemaining > 0 ? originalTotalToLose / originalDaysRemaining : 0;
    const originalWeeklyLoss = originalDailyLoss * 7;

    setCalculations({
      totalToLose,
      daysRemaining,
      requiredDailyLoss,
      requiredWeeklyLoss,
      originalDailyLoss,
      originalWeeklyLoss,
    });
  }, [targetWeight, targetDate, currentWeight, currentTargetData]);

  const handleApplyChanges = () => {
    // Validate inputs
    if (targetWeight >= currentWeight) {
      toast.error('Target weight must be less than current weight');
      return;
    }

    if (targetWeight < 40) {
      toast.error('Target weight seems too low. Please enter a realistic value.');
      return;
    }

    if (calculations.daysRemaining <= 0) {
      toast.error('Target date must be in the future');
      return;
    }

    // Update target data
    const newTarget: Partial<TargetData> = {
      endWeight: targetWeight,
      endDate: targetDate,
      totalDuration: differenceInDays(
        parseDateFlexible(targetDate) ?? new Date(targetDate),
        parseDateFlexible(currentTargetData.startDate) ?? new Date(currentTargetData.startDate)
      ),
      totalKg: currentTargetData.startWeight - targetWeight,
    };

    onUpdateTarget(newTarget);
    toast.success('Goal updated successfully!');
    setIsOpen(false);
  };

  const getDifficultyLevel = (dailyLoss: number): { label: string; color: string } => {
    if (dailyLoss < 0.1) return { label: 'Very Easy', color: 'text-[var(--accent-2)]' };
    if (dailyLoss < 0.2) return { label: 'Easy', color: 'text-[var(--accent-2)]' };
    if (dailyLoss < 0.3) return { label: 'Moderate', color: 'text-[var(--accent-3)]' };
    if (dailyLoss < 0.5) return { label: 'Challenging', color: 'text-[var(--accent)]' };
    return { label: 'Very Difficult', color: 'text-[#b55a4a]' };
  };

  const currentDifficulty = getDifficultyLevel(calculations.originalDailyLoss);
  const newDifficulty = getDifficultyLevel(calculations.requiredDailyLoss);

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2 px-4 py-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Target className="w-5 h-5" />
        <span>Adjust Goal</span>
      </motion.button>

      {/* Simulator Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Goal Simulator">
        <div className="space-y-6">
          {/* Current Progress Info */}
          <div className="bg-[var(--paper-2)] rounded-xl p-4 border border-[color:var(--border-subtle)]">
            <div className="text-sm text-[var(--ink-muted)] mb-2">Current Weight</div>
            <div className="text-3xl font-bold text-[var(--accent-2)]">
              {currentWeight.toFixed(1)} kg
            </div>
          </div>

          {/* Target Weight Slider */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-2">
              <Target className="inline w-4 h-4 mr-2" />
              Target Weight
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min={40}
                max={currentWeight - 1}
                step={0.1}
                value={targetWeight}
                onChange={e => setTargetWeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={targetWeight}
                  onChange={e => setTargetWeight(parseFloat(e.target.value))}
                  step={0.1}
                  className="w-24 px-3 py-2 border border-[color:var(--border-subtle)] rounded-xl bg-[var(--paper-3)] text-[var(--ink)] focus:ring-2 focus:ring-[color:var(--accent)]"
                />
                <span className="text-2xl font-bold text-[var(--ink)]">
                  {targetWeight.toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Target Date Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-2 border border-[color:var(--border-subtle)] rounded-xl bg-[var(--paper-3)] text-[var(--ink)] focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="bg-[var(--paper-2)] rounded-xl p-4 border border-[color:var(--border-subtle)]">
              <div className="text-sm font-medium text-[var(--ink-muted)] mb-3">
                Current Plan
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-[var(--ink-muted)]">Daily Loss</div>
                  <div className="text-lg font-bold text-[var(--ink)]">
                    {calculations.originalDailyLoss.toFixed(2)} kg
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--ink-muted)]">Weekly Loss</div>
                  <div className="text-lg font-bold text-[var(--ink)]">
                    {calculations.originalWeeklyLoss.toFixed(2)} kg
                  </div>
                </div>
                <div className={`text-sm font-semibold ${currentDifficulty.color}`}>
                  {currentDifficulty.label}
                </div>
              </div>
            </div>

            {/* New Plan */}
            <div className="bg-[rgba(61,90,128,0.12)] rounded-xl p-4 border-2 border-[color:var(--accent-2)]">
              <div className="text-sm font-medium text-[var(--accent-2)] mb-3">
                New Plan
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-[var(--ink-muted)]">Daily Loss</div>
                  <div className="text-lg font-bold text-[var(--accent-2)]">
                    {calculations.requiredDailyLoss.toFixed(2)} kg
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--ink-muted)]">Weekly Loss</div>
                  <div className="text-lg font-bold text-[var(--accent-2)]">
                    {calculations.requiredWeeklyLoss.toFixed(2)} kg
                  </div>
                </div>
                <div className={`text-sm font-semibold ${newDifficulty.color}`}>
                  {newDifficulty.label}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[var(--paper-2)] rounded-xl p-4 border border-[color:var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-[var(--accent-2)] mt-0.5" />
              <div className="flex-1 text-sm text-[var(--ink)]">
                <p>
                  To reach <strong>{targetWeight.toFixed(1)} kg</strong> by{' '}
                  <strong>{format(parseDateFlexible(targetDate) ?? new Date(targetDate), 'MMM dd, yyyy')}</strong>, you need to lose{' '}
                  <strong>{calculations.totalToLose.toFixed(1)} kg</strong> over{' '}
                  <strong>{calculations.daysRemaining} days</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApplyChanges}
              className="btn-primary flex-1 flex items-center justify-center gap-2.5"
            >
              <Check className="w-5 h-5" strokeWidth={2.5} />
              <span className="font-display font-black">Apply Changes</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-secondary px-5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
