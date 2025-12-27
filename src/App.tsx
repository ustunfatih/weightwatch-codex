import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Scale, Plus, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { WeightEntry, TargetData, Statistics } from './types';
import { fetchWeightData, fetchTargetData, addWeightEntry, updateWeightEntry, deleteWeightEntry, updateTargetData } from './services/dataService';
import { calculateStatistics } from './utils/calculations';
import { BMIGauge } from './components/BMIGauge';
import { ProgressOverview } from './components/ProgressOverview';
import { TimelineChart } from './components/TimelineChart';
import { StatisticsPanel } from './components/StatisticsPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { SkeletonDashboard } from './components/SkeletonLoaders';
import { Modal } from './components/Modal';
import { WeightEntryForm } from './components/WeightEntryForm';
import { SkipToContent } from './components/SkipToContent';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { staggerContainer, staggerItem } from './utils/animations';
import { Achievement } from './types/achievements';
import { checkAchievements, loadAchievements } from './services/achievementService';
import { STORAGE_KEYS, readString } from './services/storage';
import { parseDateFlexible } from './utils/dateUtils';

// Lazy load heavy components that aren't immediately visible
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const AchievementsGallery = lazy(() => import('./components/AchievementsGallery').then(m => ({ default: m.AchievementsGallery })));
const CelebrationModal = lazy(() => import('./components/CelebrationModal').then(m => ({ default: m.CelebrationModal })));
const ExportMenu = lazy(() => import('./components/ExportMenu').then(m => ({ default: m.ExportMenu })));
const GoalSimulator = lazy(() => import('./components/GoalSimulator').then(m => ({ default: m.GoalSimulator })));
const TrendsPage = lazy(() => import('./components/TrendsPage').then(m => ({ default: m.TrendsPage })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const SmartTips = lazy(() => import('./components/SmartTips').then(m => ({ default: m.SmartTips })));

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [targetData, setTargetData] = useState<TargetData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [showTrendsPage, setShowTrendsPage] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Memoize statistics calculation - only recalculate when entries or targetData change
  const stats = useMemo<Statistics | null>(() => {
    if (entries.length === 0 || !targetData) return null;
    try {
      return calculateStatistics(entries, targetData);
    } catch (err) {
      console.error('Failed to calculate statistics:', err);
      return null;
    }
  }, [entries, targetData]);

  // Load data function - can be called on mount and after sync
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [weightEntries, target] = await Promise.all([
        fetchWeightData(),
        fetchTargetData(),
      ]);

      setEntries(weightEntries);
      setTargetData(target);
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Failed to load your weight data: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load achievements on mount
    setAchievements(loadAchievements());

    // Check if onboarding should be shown
    const onboardingCompleted = readString(STORAGE_KEYS.ONBOARDING_COMPLETED);
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  // Check for new achievements whenever entries or stats change
  useEffect(() => {
    if (entries.length > 0 && targetData && stats) {
      const { achievements: updatedAchievements, newlyUnlocked } = checkAchievements(
        entries,
        targetData,
        stats
      );
      setAchievements(updatedAchievements);

      // Show celebration modal for newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        // Show the first newly unlocked achievement
        setCelebrationAchievement(newlyUnlocked[0]);
      }
    }
  }, [entries, stats, targetData]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleSubmitEntry = async (entry: Partial<WeightEntry>) => {
    try {
      let updatedEntries: WeightEntry[];

      if (editingEntry) {
        // Update existing entry
        updatedEntries = await updateWeightEntry(editingEntry.date, entry);
        toast.success('Weight entry updated successfully!');
      } else {
        // Add new entry
        updatedEntries = await addWeightEntry(entry);
        toast.success('Weight entry added successfully!');
      }

      setEntries(updatedEntries);
      setIsModalOpen(false);
      setEditingEntry(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry';
      toast.error(message);
    }
  };

  const handleDeleteEntry = async (date: string) => {
    try {
      const updatedEntries = await deleteWeightEntry(date);
      setEntries(updatedEntries);
      setIsModalOpen(false);
      setEditingEntry(null);
      toast.success('Weight entry deleted successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete entry';
      toast.error(message);
    }
  };

  const handleUpdateTarget = async (updates: Partial<TargetData>) => {
    try {
      const updatedTarget = await updateTargetData(updates);
      setTargetData(updatedTarget);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update target';
      toast.error(message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  if (loading) {
    return (
      <div className="app-shell">

        {/* Header Skeleton */}
        <header className="relative z-10 masthead sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-8 h-8 text-[var(--accent-2)] animate-pulse" strokeWidth={2.5} />
                <div className="h-8 w-48 bg-[var(--border-subtle)] rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-[var(--border-subtle)] rounded animate-pulse" />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonDashboard />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-3">Oops! Something went wrong</h2>
          <p className="text-[var(--ink-muted)] mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !targetData) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--ink)] font-medium">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SkipToContent />

      {/* Header - Redesigned with compact height and refined styling */}
      <header className="sticky top-0 z-50 masthead">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--ink)] text-[var(--paper-3)] flex items-center justify-center shadow-sm border border-[color:var(--border-subtle)]">
                <Scale className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-display text-2xl text-[var(--ink)]">
                Weightwatch
              </span>
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Last updated - hidden on mobile */}
              <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[var(--paper-2)] text-xs text-[var(--ink-muted)] border border-[color:var(--border-subtle)]">
                {(() => {
                  const lastDate = entries[entries.length - 1]?.date;
                  const parsed = lastDate ? parseDateFlexible(lastDate) : null;
                  const display = parsed ? parsed.toLocaleDateString() : lastDate || '';
                  return `Updated ${display}`;
                })()}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-[var(--border-subtle)] mx-1" />

              {/* Goal Simulator - hidden on smaller screens */}
              <div className="hidden lg:block">
                <Suspense fallback={<div className="w-10 h-10" />}>
                  <GoalSimulator
                    currentWeight={stats.current.weight}
                    currentTargetData={targetData}
                    onUpdateTarget={handleUpdateTarget}
                  />
                </Suspense>
              </div>

              {/* Export - hidden on mobile */}
              <div className="hidden md:block">
                <Suspense fallback={<div className="w-10 h-10" />}>
                  <ExportMenu entries={entries} targetData={targetData} stats={stats} />
                </Suspense>
              </div>

              {/* Achievements */}
              <Suspense fallback={<div className="w-10 h-10" />}>
                <AchievementsGallery achievements={achievements} />
              </Suspense>

              {/* Trends */}
              <button
                onClick={() => setShowTrendsPage(true)}
                className="icon-btn"
                title="View detailed analytics"
                aria-label="View detailed analytics"
              >
                <TrendingUp className="w-5 h-5 text-[var(--ink-muted)]" />
              </button>

              {/* Settings */}
              <Suspense fallback={<div className="w-10 h-10" />}>
                <Settings
                  onSyncComplete={loadData}
                  entries={entries}
                  targetData={targetData}
                  onDataRestore={(newEntries, newTarget) => {
                    setEntries(newEntries);
                    setTargetData(newTarget);
                  }}
                />
              </Suspense>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        id="main-content"
        role="main"
        aria-label="Dashboard content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Smart Tips */}
        <motion.section className="mb-8" variants={staggerItem}>
          <Suspense fallback={null}>
            <SmartTips entries={entries} stats={stats} />
          </Suspense>
        </motion.section>

        {/* Progress Overview */}
        <motion.section
          className="mb-8"
          variants={staggerItem}
          aria-label="Progress overview"
        >
          <ProgressOverview stats={stats} targetWeight={targetData.endWeight} />
        </motion.section>

        {/* Two Column Layout - Equal Height Cards */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch" variants={staggerItem}>
          {/* BMI Gauge */}
          <section className="lg:col-span-1 h-full" aria-label="BMI gauge">
            <BMIGauge weight={stats.current.weight} height={targetData.height} />
          </section>

          {/* Timeline Chart */}
          <section className="lg:col-span-2 h-full" aria-label="Weight timeline chart">
            <TimelineChart entries={entries} targetData={targetData} />
          </section>
        </motion.div>

        {/* Statistics Panel */}
        <motion.section
          className="mb-8"
          variants={staggerItem}
          aria-label="Weight loss statistics"
        >
          <StatisticsPanel stats={stats} />
        </motion.section>

        {/* Footer */}
        <motion.footer className="text-center text-[var(--ink-muted)] text-sm py-8" variants={staggerItem}>
          <p>Built with ❤️ using React & TypeScript</p>
          <p className="mt-2">Keep pushing towards your goals! 💪</p>
        </motion.footer>
      </motion.main>

      {/* Floating Action Button */}
      <motion.button
        onClick={handleAddEntry}
        className="fab"
        whileHover={{ scale: 1.08, boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        aria-label="Add weight entry"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </motion.button>

      {/* Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEntry ? 'Edit Weight Entry' : 'Add Weight Entry'}
      >
        <WeightEntryForm
          entry={editingEntry || undefined}
          onSubmit={handleSubmitEntry}
          onDelete={editingEntry ? handleDeleteEntry : undefined}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Achievement Celebration Modal */}
      <Suspense fallback={null}>
        <CelebrationModal
          achievement={celebrationAchievement}
          onClose={() => setCelebrationAchievement(null)}
        />
      </Suspense>

      {/* Trends Page Modal */}
      {showTrendsPage && (
        <Suspense fallback={null}>
          <TrendsPage
            entries={entries}
            targetData={targetData}
            stats={stats}
            onClose={() => setShowTrendsPage(false)}
          />
        </Suspense>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onComplete={() => setShowOnboarding(false)} />
        </Suspense>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
