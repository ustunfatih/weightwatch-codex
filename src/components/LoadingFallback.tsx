import { motion } from 'framer-motion';

export const LoadingFallback = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center p-8"
    >
      <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-2)] rounded-full animate-spin" />
    </motion.div>
  );
};

export const LoadingModal = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--border-subtle)] border-t-[var(--accent-2)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      </div>
    </div>
  );
};
