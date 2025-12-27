import { motion } from 'framer-motion';
import {
  Rocket,
  Flame,
  Award,
  Star,
  Crown,
  TrendingDown,
  Trophy,
  Zap,
  Sparkles,
  Target,
  PartyPopper,
  Sun,
  Badge,
  Lock,
} from 'lucide-react';
import { Achievement } from '../types/achievements';
import { format, parseISO } from 'date-fns';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const iconMap: Record<string, any> = {
  Rocket,
  Flame,
  Award,
  Star,
  Crown,
  TrendingDown,
  Trophy,
  Zap,
  Sparkles,
  Target,
  PartyPopper,
  Sun,
  Badge,
};

const categoryColors = {
  milestone: 'from-[#3D5A80] to-[#2F4858]',
  consistency: 'from-[#E07A5F] to-[#B55A4A]',
  progress: 'from-[#F2CC8F] to-[#E07A5F]',
  special: 'from-[#7AA2C7] to-[#3D5A80]',
};

export const AchievementBadge = ({
  achievement,
  size = 'medium',
  showDetails = false,
}: AchievementBadgeProps) => {
  const Icon = iconMap[achievement.icon] || Badge;
  const isLocked = !achievement.isUnlocked;

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`flex flex-col items-center gap-2 ${showDetails ? 'p-4' : ''}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Badge Circle */}
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
            isLocked
              ? 'bg-[var(--paper-2)] border border-[color:var(--border-subtle)]'
              : `bg-gradient-to-br ${categoryColors[achievement.category]} shadow-lg`
          }`}
          animate={
            !isLocked
              ? {
                  boxShadow: [
                    '0 0 0 0 rgba(61, 90, 128, 0)',
                    '0 0 0 10px rgba(61, 90, 128, 0)',
                  ],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          {isLocked ? (
            <Lock className={`${iconSizes[size]} text-[var(--ink-muted)]`} />
          ) : (
            <Icon className={`${iconSizes[size]} text-white`} strokeWidth={2.5} />
          )}
        </motion.div>

        {/* Unlock Date Badge */}
        {!isLocked && achievement.unlockedAt && showDetails && (
          <div className="absolute -bottom-2 -right-2 bg-[var(--paper-3)] rounded-full px-2 py-1 text-xs font-semibold text-[var(--accent-2)] border-2 border-[var(--accent-2)] shadow-md">
            {format(parseISO(achievement.unlockedAt), 'MMM dd')}
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center">
          <h3
            className={`font-bold text-sm ${
              isLocked
                ? 'text-[var(--ink-muted)]'
                : 'text-[var(--ink)]'
            }`}
          >
            {achievement.title}
          </h3>
          <p
            className={`text-xs mt-1 ${
              isLocked
                ? 'text-[var(--ink-muted)]'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            {achievement.description}
          </p>
          {isLocked && (
            <div className="mt-2 text-xs font-semibold text-[var(--ink-muted)]">
              🔒 Locked
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
