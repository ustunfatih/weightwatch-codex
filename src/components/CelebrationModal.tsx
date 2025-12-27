import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { X } from 'lucide-react';
import { Achievement } from '../types/achievements';
import { AchievementBadge } from './AchievementBadge';

interface CelebrationModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const CelebrationModal = ({ achievement, onClose }: CelebrationModalProps) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true);
      document.body.style.overflow = 'hidden';
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    }
  }, [achievement]);

  return (
    <AnimatePresence>
      {achievement && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* Confetti */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
            colors={['#10b981', '#14b8a6', '#06b6d4', '#f97316', '#8b5cf6']}
          />
        )}

        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative bg-[var(--paper-3)] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-[color:var(--border-default)]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--paper-2)] hover:bg-[var(--paper-3)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--ink-muted)]" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Celebration Header */}
            <motion.div
              className="mb-6"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-[var(--ink)] mb-2">
                🎉 Achievement Unlocked! 🎉
              </h2>
              <p className="text-[var(--ink-muted)]">
                Congratulations on your progress!
              </p>
            </motion.div>

            {/* Achievement Badge */}
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.4,
                type: 'spring',
                stiffness: 200,
              }}
            >
              <AchievementBadge achievement={achievement} size="large" showDetails={true} />
            </motion.div>

            {/* Motivational Message */}
            <motion.div
              className="bg-[rgba(61,90,128,0.12)] rounded-xl p-4 border border-[color:var(--accent-2)]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-[var(--ink)]">
                {getMotivationalMessage(achievement.category)}
              </p>
            </motion.div>

            {/* Continue Button */}
            <motion.button
              onClick={onClose}
              className="btn-primary mt-6 w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Keep Going! 💪
            </motion.button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

function getMotivationalMessage(category: string): string {
  const messages = {
    milestone: "You've reached an important milestone in your journey. Every step counts!",
    consistency: 'Your dedication is inspiring! Consistency is the key to success.',
    progress: "Amazing work on your weight loss journey! You're making real progress!",
    special: 'You unlocked something special! Keep up the great habits.',
  };

  return messages[category as keyof typeof messages] || 'Keep up the fantastic work!';
}
