import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { Achievement } from '../types/achievements';
import { AchievementBadge } from './AchievementBadge';
import { getAchievementStats } from '../services/achievementService';
import { Modal } from './Modal';

interface AchievementsGalleryProps {
  achievements: Achievement[];
}

export const AchievementsGallery = ({ achievements }: AchievementsGalleryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const stats = getAchievementStats(achievements);

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.isUnlocked) return false;
    if (filter === 'locked' && achievement.isUnlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2 px-4 py-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Award className="w-5 h-5" />
        <span>Achievements</span>
        <div className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {stats.unlocked}/{stats.total}
        </div>
      </motion.button>

      {/* Gallery Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Your Achievements"
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="bg-[var(--paper-2)] rounded-xl p-4 border border-[color:var(--border-subtle)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  Progress Overview
                </h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  {stats.unlocked} of {stats.total} achievements unlocked
                </p>
              </div>
              <div className="text-3xl font-bold text-[var(--accent-2)]">
                {stats.percentComplete.toFixed(0)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent-2)]"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentComplete}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'unlocked', 'locked'].map(option => (
                <button
                  key={option}
                  onClick={() => setFilter(option as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === option
                      ? 'bg-[var(--ink)] text-[var(--paper-3)] shadow-md'
                      : 'bg-[var(--paper-2)] text-[var(--ink-muted)] hover:bg-[var(--paper-3)]'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'milestone', 'consistency', 'progress', 'special'].map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === category
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--paper-2)] text-[var(--ink-muted)] hover:bg-[var(--paper-3)]'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {category !== 'all' && (
                    <span className="ml-1 opacity-70">
                      ({stats.byCategory[category]?.unlocked || 0}/
                      {stats.byCategory[category]?.total || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--paper-2)] rounded-xl p-3 border border-[color:var(--border-subtle)]"
              >
                <AchievementBadge
                  achievement={achievement}
                  size="medium"
                  showDetails={true}
                />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAchievements.length === 0 && (
            <div className="text-center py-8 text-[var(--ink-muted)]">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No achievements found with current filters</p>
            </div>
          )}

          {/* Close Button */}
          <motion.button
            onClick={() => setIsOpen(false)}
            className="btn-secondary w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </div>
      </Modal>
    </>
  );
};
