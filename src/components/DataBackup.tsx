import { useState } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WeightEntry, TargetData } from '../types';
import { Achievement } from '../types/achievements';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { STORAGE_KEYS, readJSON, readString, writeJSON, writeString } from '../services/storage';

interface BackupData {
    version: string;
    exportDate: string;
    entries: WeightEntry[];
    targetData: TargetData | null;
    achievements: Achievement[];
    settings: {
        theme?: string;
        timelineView?: string;
        reminder?: any;
    };
}

interface DataBackupProps {
    entries: WeightEntry[];
    targetData: TargetData | null;
    onRestore: (entries: WeightEntry[], targetData: TargetData | null) => void;
}

export function DataBackup({ entries, targetData, onRestore }: DataBackupProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const createBackup = () => {
        setIsProcessing(true);

        try {
            // Gather all data
            const achievements = readJSON<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);

            const backupData: BackupData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                entries,
                targetData,
                achievements,
                settings: {
                    theme: readString(STORAGE_KEYS.THEME) || undefined,
                    timelineView: readString(STORAGE_KEYS.TIMELINE_VIEW) || undefined,
                    reminder: readString(STORAGE_KEYS.REMINDER_SETTINGS) || undefined,
                },
            };

            // Create downloadable file
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `weightwatch-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Backup created successfully!');
        } catch (error) {
            console.error('Backup error:', error);
            toast.error('Failed to create backup');
        } finally {
            setIsProcessing(false);
        }
    };

    const restoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const backupData: BackupData = JSON.parse(content);

                // Validate backup data
                if (!backupData.version || !backupData.entries) {
                    throw new Error('Invalid backup file format');
                }

                // Restore data
                onRestore(backupData.entries, backupData.targetData);

                // Restore achievements
                if (backupData.achievements) {
                    writeJSON(STORAGE_KEYS.ACHIEVEMENTS, backupData.achievements);
                }

                // Restore settings
                if (backupData.settings.theme) {
                    writeString(STORAGE_KEYS.THEME, backupData.settings.theme);
                }
                if (backupData.settings.timelineView) {
                    writeString(STORAGE_KEYS.TIMELINE_VIEW, backupData.settings.timelineView);
                }
                if (backupData.settings.reminder) {
                    writeString(STORAGE_KEYS.REMINDER_SETTINGS, backupData.settings.reminder);
                }

                toast.success('Data restored successfully! Reloading...');

                // Reload page to apply all changes
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (error) {
                console.error('Restore error:', error);
                toast.error('Failed to restore backup. Please check the file.');
            } finally {
                setIsProcessing(false);
            }
        };

        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[var(--accent-2)] rounded-full flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">Backup & Restore</h3>
                    <p className="text-sm text-[var(--ink-muted)]">Protect your data</p>
                </div>
            </div>

            <div className="space-y-3">
                {/* Backup Button */}
                <motion.button
                    onClick={createBackup}
                    disabled={isProcessing || entries.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: entries.length > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: entries.length > 0 ? 0.98 : 1 }}
                >
                    <Download className="w-5 h-5" />
                    <span>Create Backup</span>
                </motion.button>

                {/* Restore Button */}
                <div className="relative">
                    <input
                        id="restore-file"
                        type="file"
                        accept=".json"
                        onChange={restoreBackup}
                        disabled={isProcessing}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <motion.button
                        disabled={isProcessing}
                        className="btn-secondary w-full flex items-center justify-center gap-3 px-6 py-4 disabled:opacity-50"
                        whileHover={{ scale: !isProcessing ? 1.02 : 1 }}
                        whileTap={{ scale: !isProcessing ? 0.98 : 1 }}
                    >
                        <Upload className="w-5 h-5" />
                        <span>Restore from Backup</span>
                    </motion.button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[rgba(61,90,128,0.12)] rounded-xl border border-[color:var(--accent-2)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent-2)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--accent-2)]">What's included</p>
                        <p className="text-xs text-[var(--ink)] mt-1">
                            All weight entries, goals, achievements, and settings
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[rgba(224,122,95,0.12)] rounded-xl border border-[color:var(--accent)]">
                    <AlertCircle className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--accent)]">Important</p>
                        <p className="text-xs text-[var(--ink)] mt-1">
                            Restoring will replace all current data. Make sure to backup first!
                        </p>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--ink-muted)]">
                    <div className="w-4 h-4 border-2 border-[var(--accent-2)] border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                </div>
            )}
        </div>
    );
}
