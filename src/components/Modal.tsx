import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFocusTrap } from '../utils/accessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      // Set up focus trap
      const cleanup = modalRef.current ? createFocusTrap(modalRef.current) : undefined;

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        cleanup?.();
      };
    }
  }, [isOpen, onClose]);

  // Render modal using createPortal to escape parent stacking contexts
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 99999 }}
          >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-[color:var(--border-default)] pointer-events-auto bg-[var(--paper-3)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[color:var(--border-subtle)]">
              <h2
                id="modal-title"
                className="font-display text-2xl font-black text-[var(--ink)]"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--paper-2)] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-[var(--ink-muted)]" />
              </button>
            </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use createPortal to render modal at document.body level
  return createPortal(modalContent, document.body);
};
