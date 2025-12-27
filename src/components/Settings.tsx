import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Link as LinkIcon, Unlink, RefreshCw, Check, AlertCircle, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { googleSheetsService, SyncStatus } from '../services/GoogleSheetsService';
import { Modal } from './Modal';
import { DailyReminder } from './DailyReminder';
import { DataBackup } from './DataBackup';
import { GoogleSheetsSetupGuide } from './GoogleSheetsSetupGuide';
import { WeightEntry, TargetData } from '../types';
import { updateLastEntryDate } from '../services/dataService';
import { STORAGE_KEYS, writeJSON, writeString, readString } from '../services/storage';

interface SettingsProps {
  onSyncComplete?: () => void;
  entries?: WeightEntry[];
  targetData?: TargetData | null;
  onDataRestore?: (entries: WeightEntry[], targetData: TargetData | null) => void;
}

export const Settings = ({ onSyncComplete, entries = [], targetData = null, onDataRestore }: SettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'reminders' | 'backup'>('sync');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

  type TabConfig = {
    id: 'sync' | 'reminders' | 'backup';
    label: string;
    icon: typeof LinkIcon;
  };

  const tabs: TabConfig[] = [
    { id: 'sync', label: 'Sync', icon: LinkIcon },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  useEffect(() => {
    // Load saved sheet ID from env or localStorage
    const envSheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
    const savedSheetId = readString(STORAGE_KEYS.GOOGLE_SHEET_ID, envSheetId || '');
    setSheetId(savedSheetId);
    googleSheetsService.setSpreadsheetId(savedSheetId);

    // Initialize Google Sheets service
    googleSheetsService.initClient().catch(err => {
      console.error('Failed to initialize Google Sheets:', err);
    });

    setIsSignedIn(googleSheetsService.isSignedIn());

    // Subscribe to sync status changes
    const unsubscribe = googleSheetsService.onStatusChange((status) => {
      setSyncStatus(status);
      setLastSyncTime(googleSheetsService.getLastSyncTime());
    });

    return unsubscribe;
  }, []);

  const syncFromSheets = async (showToast: boolean) => {
    if (!sheetId) {
      if (showToast) toast.error('Please enter your Google Sheet ID');
      return;
    }
    if (!isSignedIn) {
      if (showToast) toast.error('Please connect to Google Sheets first');
      return;
    }

    try {
      const data = await googleSheetsService.syncFromSheets();

      if (data.changed) {
        writeJSON(STORAGE_KEYS.WEIGHT_ENTRIES, data.entries);
        writeJSON(STORAGE_KEYS.TARGET_DATA, data.targetData);
        updateLastEntryDate(data.entries);
        if (onSyncComplete) onSyncComplete();
      }

      if (showToast) {
        if (data.changed) {
          toast.success('Data synced successfully!');
        } else {
          toast.success('No changes detected in Google Sheets');
        }
      }
    } catch (err) {
      if (showToast) {
        const message = err instanceof Error ? err.message : 'Failed to sync data';
        toast.error(message);
      }
    }
  };

  const handleConnect = async () => {
    try {
      await googleSheetsService.signIn();
      setIsSignedIn(true);
      toast.success('Connected to Google Sheets!');
      syncFromSheets(false);
    } catch (err) {
      console.error('Sign in error:', err);
      toast.error('Failed to connect to Google Sheets');
    }
  };

  const handleDisconnect = () => {
    googleSheetsService.signOut();
    setIsSignedIn(false);
    toast.success('Disconnected from Google Sheets');
  };

  const handleSync = async () => {
    await syncFromSheets(true);
  };

  const handleSheetIdChange = (value: string) => {
    setSheetId(value);
    writeString(STORAGE_KEYS.GOOGLE_SHEET_ID, value);
    googleSheetsService.setSpreadsheetId(value);
  };

  useEffect(() => {
    if (!isSignedIn || !sheetId) return;

    const interval = setInterval(() => {
      syncFromSheets(false);
    }, AUTO_SYNC_INTERVAL_MS);

    syncFromSheets(false);

    const handleFocus = () => syncFromSheets(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSignedIn, sheetId]);

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <div className="flex items-center gap-2 text-[var(--accent-2)]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Syncing...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-[var(--accent-2)]">
            <Check className="w-4 h-4" />
            <span className="text-sm">
              Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Sync failed{googleSheetsService.getLastError() ? `: ${googleSheetsService.getLastError()}` : ''}
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <span className="text-sm">Not synced</span>
          </div>
        );
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="icon-btn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Settings"
      >
        <SettingsIcon className="w-5 h-5 text-[var(--ink-muted)]" />
      </motion.button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Settings">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="segmented flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`segmented-btn flex-1 flex items-center justify-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'sync' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
                Google Sheets Integration
              </h3>

              {/* Sheet ID Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink-muted)] mb-2">
                  Google Sheet ID
                </label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => handleSheetIdChange(e.target.value)}
                  placeholder="Enter your Google Sheet ID"
                  className="w-full px-4 py-2 border border-[color:var(--border-subtle)] rounded-xl bg-[var(--paper-3)] text-[var(--ink)] focus:ring-2 focus:ring-[color:var(--accent)] focus:border-transparent transition-all"
                />
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  Find this in your Google Sheet URL between /d/ and /edit
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-[var(--paper-2)] rounded-xl border border-[color:var(--border-subtle)] mb-4">
                <div className="flex items-center gap-3">
                  {isSignedIn ? (
                    <>
                      <div className="w-3 h-3 bg-[var(--accent-2)] rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-[var(--ink)]">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-[var(--border-subtle)] rounded-full" />
                      <span className="text-sm font-medium text-[var(--ink-muted)]">
                        Not Connected
                      </span>
                    </>
                  )}
                </div>
                {getSyncStatusDisplay()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isSignedIn ? (
                  <motion.button
                    onClick={handleConnect}
                    disabled={!sheetId}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LinkIcon className="w-5 h-5" />
                    Connect to Google Sheets
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={handleSync}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 px-4 py-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RefreshCw className="w-5 h-5" />
                      Sync Now
                    </motion.button>
                    <motion.button
                      onClick={handleDisconnect}
                      className="px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Unlink className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </div>

              <GoogleSheetsSetupGuide />
            </div>
          )}

          {activeTab === 'reminders' && <DailyReminder />}

          {activeTab === 'backup' && onDataRestore && (
            <DataBackup
              entries={entries}
              targetData={targetData}
              onRestore={onDataRestore}
            />
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
