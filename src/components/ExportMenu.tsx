import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WeightEntry, TargetData, Statistics } from '../types';
import {
  exportToCSV,
  exportToPDF,
  generateShareImage,
  copyShareLink,
  downloadShareImage,
} from '../services/exportService';

interface ExportMenuProps {
  entries: WeightEntry[];
  targetData: TargetData;
  stats: Statistics;
}

export const ExportMenu = ({ entries, targetData, stats }: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleExportCSV = async () => {
    try {
      await exportToCSV(entries, targetData);
      toast.success('CSV exported successfully!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Export the main content area
      await exportToPDF('dashboard-content', `weightwatch-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  const handleGenerateShareImage = async () => {
    try {
      setIsGeneratingImage(true);
      const imageDataUrl = await generateShareImage(stats, targetData);
      downloadShareImage(imageDataUrl);
      toast.success('Share image downloaded!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to generate share image');
      console.error('Share image error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyShareLink();
      toast.success('Link copied to clipboard!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy link');
      console.error('Copy link error:', error);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary flex items-center gap-2 px-4 py-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Download className="w-5 h-5" />
        <span>Export</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              className="absolute right-0 top-full mt-2 w-64 bg-[var(--paper-3)] rounded-xl shadow-2xl border border-[color:var(--border-default)] overflow-hidden z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2 space-y-1">
                {/* CSV Export */}
                <motion.button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <FileText className="w-5 h-5 text-[var(--accent-2)]" />
                  <div className="flex-1">
                    <div className="font-medium">Export CSV</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      Download all data
                    </div>
                  </div>
                </motion.button>

                {/* PDF Export */}
                <motion.button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <Download className="w-5 h-5 text-[var(--accent-2)]" />
                  <div className="flex-1">
                    <div className="font-medium">Export PDF</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      Full report document
                    </div>
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="h-px bg-[var(--border-subtle)] my-2" />

                {/* Share Image */}
                <motion.button
                  onClick={handleGenerateShareImage}
                  disabled={isGeneratingImage}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ x: 4 }}
                >
                  <ImageIcon className="w-5 h-5 text-[var(--accent-3)]" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {isGeneratingImage ? 'Generating...' : 'Share Image'}
                    </div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      Create progress card
                    </div>
                  </div>
                </motion.button>

                {/* Copy Link */}
                <motion.button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <Copy className="w-5 h-5 text-[var(--accent)]" />
                  <div className="flex-1">
                    <div className="font-medium">Copy Link</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      Share your dashboard
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
